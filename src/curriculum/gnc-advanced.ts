/* ============================================================================
   ORBIT — GNC advanced curriculum, Tiers 5–7
   ----------------------------------------------------------------------------
   Tier 5  Guidance, continued      (m42–m43)  trajectory optimization, convex
                                               powered-descent guidance
   Tier 6  Flight software, sim, V&V (m44–m47)
   Tier 7  Integration & career      (m48–m49)

   The sibling files carry everything up to t5_m41_ascent_guidance; this file
   references those modules by id only. t5_m43_convex_guidance is the single
   most distinctive module in the corpus — it is the one a SpaceX landing-GNC
   interview is actually about — and is weighted accordingly.
   ========================================================================== */

import type { Module } from './types'

export const GNC_ADVANCED: Module[] = [
  /* ══════════════════════════════════════════════════════════════════════════
     TIER 5 — GUIDANCE (continued)
     ══════════════════════════════════════════════════════════════════════════ */

  {
    id: 't5_m42_trajectory_optimization',
    track: 'gnc',
    tier: 5,
    title: 'Trajectory Optimization',
    summary:
      'Turn a vehicle trajectory design problem into a nonlinear program you can actually solve: write defect constraints, pick between shooting, collocation and pseudospectral transcription, and debug an NLP that refuses to converge. You will solve one problem twice — once by indirect shooting, once by Hermite-Simpson collocation — and be able to say precisely why industry flies the direct one.',
    prereqs: ['t0_m11_optimization', 't3_m29_optimal_control_lqr', 't2_m20_orbital_maneuvers'],
    hours: 85,
    topics: [
      'The general optimal control problem in Bolza, Mayer and Lagrange form, and how to convert between them',
      'Indirect methods: the Hamiltonian, the Euler-Lagrange conditions, costates as shadow prices',
      "Pontryagin's Minimum Principle, the stationarity condition, and transversality conditions",
      'The two-point boundary value problem; single and multiple shooting; costate sensitivity and why indirect methods are brittle',
      'Bang-bang control, the switching function, and singular arcs',
      'Direct transcription: converting an infinite-dimensional problem into a finite NLP',
      'Direct single shooting vs direct multiple shooting, and the conditioning difference between them',
      'Direct collocation: trapezoidal and Hermite-Simpson defect constraints',
      'Pseudospectral methods: Legendre-Gauss, Legendre-Gauss-Radau and Legendre-Gauss-Lobatto nodes',
      'Spectral convergence, the covector mapping theorem, and what pseudospectral costates buy you',
      'Mesh refinement driven by an interpolated-defect error estimate',
      'Differential dynamic programming and iLQR as the shooting-flavoured alternative',
      'NLP sparsity structure, the Jacobian and Hessian block pattern, and why sparsity decides solve time',
      'Scaling and conditioning: non-dimensionalising states, controls and constraints before you solve anything',
      'Warm starting, homotopy and continuation from an easy problem to the real one',
      'Tooling: CasADi with IPOPT, GPOPS-II, PSOPT, Dymos/OpenMDAO, PyOMO, ACADO, trajax',
      'Failure modes: infeasible restoration, unbounded multipliers, mesh-induced control ringing, badly posed terminal constraints',
    ],
    objectives: [
      "Derive the necessary conditions from Pontryagin's Minimum Principle and predict when bang-bang control must appear",
      'Implement trapezoidal and Hermite-Simpson collocation from scratch and measure their defect convergence order',
      'Solve the same transfer by indirect shooting and by direct collocation and compare accuracy, robustness and setup cost',
      'Set up a vehicle problem in CasADi with sensible scaling and read the IPOPT log well enough to diagnose non-convergence',
      'State the three concrete reasons direct methods dominate flight-trajectory design',
    ],
    resources: [
      {
        title: 'An Introduction to Trajectory Optimization: How to Do Your Own Direct Collocation',
        author: 'Matthew Kelly, SIAM Review 59(4):849-904, 2017',
        kind: 'paper',
        url: 'https://www.matthewpeterkelly.com/tutorials/trajectoryOptimization/index.html',
        free: true,
        note: 'The single best entry point. Builds from trapezoidal collocation on a toy problem up to Hermite-Simpson on a biped, with code.',
      },
      {
        title: 'Practical Methods for Optimal Control and Estimation Using Nonlinear Programming',
        author: 'John T. Betts (SIAM, 2nd ed. 2010)',
        kind: 'book',
        free: false,
        note: 'The industrial reference. Sparse NLP structure, mesh refinement and scaling in the detail a real problem needs.',
      },
      {
        title: 'A Survey of Numerical Methods for Optimal Control (AAS 09-334)',
        author: 'Anil V. Rao',
        kind: 'paper',
        free: true,
        note: 'The map of the field in twenty pages. Read it before you choose a transcription.',
      },
      {
        title: 'Applied Optimal Control: Optimization, Estimation and Control',
        author: 'Bryson & Ho',
        kind: 'book',
        free: false,
        note: 'The classical indirect treatment; still the clearest source on costates and transversality.',
      },
      {
        title: 'Underactuated Robotics',
        author: 'Russ Tedrake (MIT 6.832)',
        kind: 'course',
        url: 'https://underactuated.mit.edu/',
        free: true,
        note: 'The trajectory optimization and DDP/iLQR chapters, with runnable notebooks.',
      },
      {
        title: 'CasADi documentation and examples',
        kind: 'docs',
        url: 'https://web.casadi.org/docs/',
        free: true,
        note: 'Automatic differentiation plus IPOPT. The fastest path from equations of motion to a solved trajectory.',
      },
      {
        title: 'Dymos — trajectory optimization on OpenMDAO',
        author: 'NASA Glenn',
        kind: 'tool',
        url: 'https://github.com/OpenMDAO/dymos',
        free: true,
        note: 'Collocation and Radau pseudospectral transcription with gradient-based MDO around it.',
      },
      {
        title: 'GPOPS-II',
        author: 'Patterson & Rao',
        kind: 'tool',
        free: false,
        note: 'MATLAB hp-adaptive Radau pseudospectral solver; the reference commercial implementation.',
      },
    ],
    exercises: [
      {
        id: 'ex_m42_collocation',
        title: 'Trapezoidal and Hermite-Simpson collocation from scratch',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `Direct collocation is nothing but a quadrature rule promoted to an equality constraint. Implement both defect forms yourself so the rest of the module stops being magic.

1. Implement **trapezoid_defects** — for a uniform mesh with knot states x_k and dynamics values f_k,

   d_k = x_{k+1} - x_k - (h/2)(f_k + f_{k+1})

2. Implement **hermite_simpson_defects** in compressed form. The interpolated midpoint is

   x_mid = (x_k + x_{k+1})/2 + (h/8)(f_k - f_{k+1}),   u_mid = (u_k + u_{k+1})/2

   and the defect is the Simpson quadrature

   d_k = x_{k+1} - x_k - (h/6)(f_k + 4 f_mid + f_{k+1})

3. Sample the exact solution of xdot = -x at the knots and plot max|d| against h on log axes for both schemes. Read the slope off the plot. You should measure a **local** order of 3 for trapezoid and 5 for Hermite-Simpson, which is the global order of 2 and 4 respectively.

Success: both slopes come out right, and you can explain in one sentence why an NLP that drives every d_k to zero is solving the differential equation.`,
        starter: `import numpy as np


def trapezoid_defects(x, f, h):
    """Trapezoidal collocation defects on a uniform mesh.

    x : (N+1, n) states at the knot points
    f : (N+1, n) dynamics f(x_k, u_k) evaluated at the knot points
    h : segment duration (scalar)

    Returns (N, n) defects d_k = x_{k+1} - x_k - h/2 * (f_k + f_{k+1}).
    """
    raise NotImplementedError


def hermite_simpson_defects(x, u, fn, h):
    """Compressed Hermite-Simpson defects on a uniform mesh.

    x  : (N+1, n) states at the knot points
    u  : (N+1, m) controls at the knot points
    fn : callable fn(x_k, u_k) -> (n,) dynamics
    h  : segment duration (scalar)

    Returns (N, n) defects.
    """
    raise NotImplementedError


def defect_order(scheme, hs):
    """Max defect magnitude of the exact solution of xdot = -x, for each h in hs.

    Sample x(t) = exp(-t) on a uniform mesh of duration h and return an array of
    max|d| so the observed order can be read off a log-log fit.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'trapezoid defect vanishes on an exactly integrable ramp',
            assert: `import numpy as np
h = 0.25
t = np.arange(0.0, 2.0 + h, h)
x = (3.0 * t).reshape(-1, 1)
f = np.full_like(x, 3.0)
d = trapezoid_defects(x, f, h)
assert d.shape == (len(t) - 1, 1), "expected (N, n) defects, got %r" % (d.shape,)
assert np.max(np.abs(d)) < 1e-12, "a constant derivative must be integrated exactly"`,
          },
          {
            name: 'trapezoid defect matches the hand-computed value for xdot = -x',
            assert: `import numpy as np
h = 0.5
t = np.array([0.0, 0.5, 1.0])
x = np.exp(-t).reshape(-1, 1)
f = -x
d = trapezoid_defects(x, f, h)
expect = np.array([[np.exp(-0.5) - 1.0 + 0.25 * (1.0 + np.exp(-0.5))],
                   [np.exp(-1.0) - np.exp(-0.5) + 0.25 * (np.exp(-0.5) + np.exp(-1.0))]])
assert np.allclose(d, expect, atol=1e-12), "defect sign or factor of two is wrong"`,
          },
          {
            name: 'Hermite-Simpson is exact when the derivative is linear in time',
            assert: `import numpy as np
h = 0.2
t = np.arange(0.0, 1.0 + h, h)
u = (1.0 + 2.0 * t).reshape(-1, 1)
x = (t + t ** 2).reshape(-1, 1)
d = hermite_simpson_defects(x, u, lambda xk, uk: uk, h)
assert np.max(np.abs(d)) < 1e-12, "Simpson integrates a linear integrand exactly"`,
          },
          {
            name: 'Hermite-Simpson converges two orders faster than trapezoid',
            assert: `import numpy as np
hs = np.array([0.4, 0.2, 0.1, 0.05])
e_tr = np.asarray(defect_order("trapezoid", hs), dtype=float)
e_hs = np.asarray(defect_order("hermite-simpson", hs), dtype=float)
p_tr = np.polyfit(np.log(hs), np.log(e_tr), 1)[0]
p_hs = np.polyfit(np.log(hs), np.log(e_hs), 1)[0]
assert abs(p_tr - 3.0) < 0.25, "trapezoid local defect should fall as h^3, measured %.2f" % p_tr
assert abs(p_hs - 5.0) < 0.35, "Hermite-Simpson local defect should fall as h^5, measured %.2f" % p_hs`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m42_pmp_bangbang',
        title: 'Pontryagin by hand: the minimum-time double integrator',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `The double integrator is the smallest problem that shows every feature of the Minimum Principle, and you should be able to do it on a whiteboard.

For xddot = u with |u| <= umax, minimum time to the origin:

1. Write the Hamiltonian H = 1 + p1 v + p2 u, take the costate equations, and show p1 is constant and p2 is **affine in time**. Conclude that the switching function changes sign at most once, so the optimal control is bang-bang with exactly one switch.
2. Derive the switching curve x = -v|v| / (2 umax) and the closed-form minimum time.
3. Implement **min_time** and **first_control**, then verify by integrating the resulting control and checking you land on the origin.

Success: your closed-form time matches a brute-force bisection search to 1e-6, and you can state the switching curve from memory.`,
        starter: `import numpy as np


def first_control(x0, v0, umax=1.0):
    """Sign of the first bang for the minimum-time double integrator.

    Returns +umax or -umax. On the switching curve either branch is a single
    arc; return the one that drives the state to the origin without switching.
    """
    raise NotImplementedError


def min_time(x0, v0, umax=1.0):
    """Minimum time to drive x'' = u, |u| <= umax, from (x0, v0) to the origin."""
    raise NotImplementedError


def switch_time(x0, v0, umax=1.0):
    """Time of the single control reversal. Zero when the state starts on the
    switching curve."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'unit rest-to-rest takes two seconds with a switch at one',
            assert: `assert abs(min_time(1.0, 0.0) - 2.0) < 1e-9, "from (1, 0) the minimum time is 2 s"
assert abs(min_time(-1.0, 0.0) - 2.0) < 1e-9, "the problem is symmetric"
assert abs(switch_time(1.0, 0.0) - 1.0) < 1e-9, "the single reversal is halfway"
assert first_control(1.0, 0.0) < 0, "a positive position must brake first"`,
          },
          {
            name: 'a state on the switching curve needs no reversal',
            assert: `assert abs(min_time(-0.5, 1.0) - 1.0) < 1e-9, "(-0.5, 1) lies on the curve x = -v|v|/2"
assert abs(switch_time(-0.5, 1.0)) < 1e-9, "no switch on the curve"`,
          },
          {
            name: 'closed form agrees with a brute-force search',
            assert: `import numpy as np

def simulate(x0, v0, umax, ts, T, n=200000):
    dt = T / n
    x, v = x0, v0
    u1 = first_control(x0, v0, umax)
    for i in range(n):
        u = u1 if i * dt < ts else -u1
        v += u * dt
        x += v * dt
    return x, v

for (x0, v0) in [(1.0, 0.0), (0.0, 1.0), (2.0, -0.5), (-3.0, 1.5)]:
    T = min_time(x0, v0)
    ts = switch_time(x0, v0)
    assert 0.0 <= ts <= T + 1e-9, "switch must fall inside the horizon"
    xf, vf = simulate(x0, v0, 1.0, ts, T)
    assert abs(xf) < 5e-3 and abs(vf) < 5e-3, "state (%r, %r) missed the origin: %r" % (x0, v0, (xf, vf))`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m42_goddard',
        title: 'The Goddard rocket and its singular arc',
        kind: 'build',
        hours: 14,
        prompt: `Solve the classic Goddard problem — maximise the final altitude of a vertically ascending rocket with drag, thrust bounded by 0 <= T <= Tmax, fixed propellant.

1. Transcribe it with Hermite-Simpson collocation in CasADi (or PSOPT/Dymos) and solve with IPOPT. Non-dimensionalise altitude, velocity and mass first; the un-scaled problem will not converge.
2. Plot the thrust history. You should see **full thrust, then an intermediate arc that sits strictly between the bounds, then thrust off**. That middle arc is a singular arc: the switching function is identically zero over an interval, so the Minimum Principle cannot determine the control pointwise and it is fixed instead by differentiating the switching function until the control reappears.
3. Refine the mesh around the two junctions and show the thrust profile stops ringing.
4. Write half a page comparing what you got to the indirect solution in Bryson & Ho.

Success: a converged solution with a visible singular arc, mesh-refined junctions, and a written explanation of why the singular arc exists physically (drag makes it wasteful to fly at maximum thrust through the dense atmosphere).`,
      },
      {
        id: 'ex_m42_indirect_vs_direct',
        title: 'The same transfer, both ways',
        kind: 'analysis',
        hours: 10,
        prompt: `Take a minimum-time low-thrust planar orbit transfer between two circular orbits.

1. Solve it by **indirect single shooting**: form the Hamiltonian, get the costate ODEs, guess the initial costates, and let a root finder hit the terminal conditions. Record how many initial guesses you had to try before one converged, and how large the costate sensitivity is.
2. Solve it by **direct collocation** from a straight-line initial guess.
3. Compare: final cost, convergence basin, wall-clock time, and how long it took you to write each.
4. Then extend both to include a thrust-pointing constraint and report which one you had to re-derive.

Success: a short written comparison whose conclusion you could defend in an interview, with the three standard arguments for direct methods stated in your own words — no costate guessing, constraints are added declaratively rather than re-derived, and the NLP is sparse so the solve scales.`,
      },
    ],
    quiz: [
      {
        id: 'q_m42_pmp',
        q: 'For a control-affine system with a bounded control, why does the Minimum Principle generically produce bang-bang control?',
        choices: [
          'Because the cost is quadratic, so the optimum lies at the vertex of the feasible set',
          'Because the Hamiltonian is affine in the control, so minimising it over a box pushes the control to whichever bound the sign of the switching function selects; the control is interior only where the switching function is identically zero',
          'Because the dynamics are linear and linear systems always saturate',
          'Because numerical solvers cannot represent intermediate control values',
        ],
        answer: 1,
        explain:
          'Write H = L + p^T (f(x) + g(x) u). If L does not depend on u, then H is affine in u with slope s = g(x)^T p, the switching function. Minimising an affine function over a box puts u at its lower bound where s > 0 and at its upper bound where s < 0 — bang-bang. The only escape is s = 0 on a whole interval, which is a singular arc, and there the control is recovered by differentiating s in time until u reappears. A control cost that is strictly convex in u (for example quadratic) destroys the affine structure and gives smooth interior control instead.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_m42_defect',
        q: 'What is a defect constraint in direct collocation?',
        choices: [
          'A penalty term added to the cost that discourages infeasible trajectories',
          'An equality constraint equating the change in the state across a segment to a quadrature of the dynamics, so that driving every defect to zero makes the discrete trajectory satisfy the differential equation',
          'The difference between the optimal cost and the cost of the current iterate',
          'A slack variable that absorbs violations of the path constraints',
        ],
        answer: 1,
        explain:
          'Collocation replaces integration with algebra: states and controls at the mesh points become NLP decision variables, and one equality constraint per segment per state — the defect — says that x_{k+1} minus x_k equals the quadrature of f over that segment. A feasible point of the NLP is, to the order of the quadrature rule, a solution of the ODE. That is the whole idea: the dynamics are enforced as constraints rather than by marching, which is why the solver can violate them early in the iteration and still converge.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'q_m42_hs_order',
        q: 'You halve the mesh spacing in a Hermite-Simpson transcription. Roughly what happens to the trajectory error?',
        choices: [
          'It halves — the scheme is first order',
          'It falls by about a factor of 4 — the scheme is second order',
          'It falls by about a factor of 16 — the scheme is fourth-order accurate globally, from a fifth-order local defect',
          'It is unchanged; accuracy is set by the NLP tolerance, not the mesh',
        ],
        answer: 2,
        explain:
          'Hermite-Simpson uses a cubic Hermite interpolant for the state and Simpson quadrature for the dynamics. The local defect of the exact solution is O(h^5), giving a global order of 4, so halving h buys about 16x. Trapezoidal collocation is second order globally (O(h^3) local). This matters practically: doubling the node count on a Hermite-Simpson mesh is usually cheaper than moving to a finer trapezoid mesh for the same accuracy, because the NLP grows linearly while error falls as the fourth power.',
        b: 1.2,
        bloom: 'apply',
      },
      {
        id: 'q_m42_indirect_brittle',
        q: 'Why are indirect methods considered brittle in practice?',
        choices: [
          'Because the Euler-Lagrange conditions are only necessary and never sufficient',
          'Because they require an initial guess for costates, which have no physical meaning and to which the terminal state is extremely sensitive, and because every added path constraint changes the structure of the boundary-value problem and must be re-derived',
          'Because costate equations cannot be integrated numerically',
          'Because they always give a worse optimum than direct methods',
        ],
        answer: 1,
        explain:
          'Two separate problems. First, shooting on costates is exponentially ill-conditioned: a costate perturbation of 1e-6 can move a long-duration terminal state by kilometres, so the convergence basin is tiny and you cannot guess into it from physical intuition. Second, constraints are structural: adding a state-path constraint introduces interior arcs, junction conditions and jump multipliers that must be worked out by hand for each new constraint set. Indirect solutions are typically more accurate when they converge — which is why they are still used to certify direct answers — but direct transcription is what you can actually iterate a vehicle design with.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_m42_pseudospectral',
        q: 'Pseudospectral methods converge spectrally. When does that advantage disappear?',
        choices: [
          'When the problem has more than ten states',
          'When the solution is not smooth — a bang-bang switch, a constraint activation, or a staging discontinuity reduces convergence to algebraic, which is why hp-adaptive schemes place mesh breakpoints at the discontinuities',
          'When the final time is free',
          'When the dynamics are nonlinear',
        ],
        answer: 1,
        explain:
          'Spectral convergence — error falling faster than any power of 1/N — comes from approximating the solution by a global polynomial, and holds only if the function being approximated is analytic on the interval. A discontinuous control or a kink in the state breaks that and the convergence rate collapses to algebraic, with Gibbs ringing near the jump. The fix is hp-adaptive refinement: split the interval at the junction and use a high-order polynomial on each smooth piece. A vehicle trajectory with staging, throttle bounds and constraint activations is full of such junctions, so in practice you plan the mesh around them.',
        b: 1.6,
        bloom: 'analyze',
      },
      {
        id: 'q_m42_covector',
        q: 'What does the covector mapping theorem give you?',
        choices: [
          'A proof that the direct NLP solution is the global optimum',
          'A relation between the NLP Lagrange multipliers of the discretised problem and the costates of the original continuous optimal control problem, so a direct solve can be checked against the Minimum Principle',
          'A method of transforming state constraints into control constraints',
          'A way to compute the Hessian of the Hamiltonian without differentiating',
        ],
        answer: 1,
        explain:
          'The discretised problem has KKT multipliers on its defect constraints; the continuous problem has costates. The covector mapping theorem says that with the right node set and the right scaling — and the mapping is not the identity, which is precisely the content of the theorem — those multipliers converge to the continuous costates. That gives you a free optimality check: solve directly, map the multipliers to costates, and verify that the Hamiltonian is constant (for a time-invariant problem), that it is zero for free final time, and that the switching structure is what the Minimum Principle predicts. Any mismatch usually means the mesh is too coarse or the problem is badly scaled.',
        b: 1.8,
        bloom: 'understand',
      },
      {
        id: 'q_m42_sparsity',
        q: 'Why do direct multiple shooting and collocation scale so much better than direct single shooting?',
        choices: [
          'They have fewer decision variables',
          'Their constraint Jacobians are block-banded because each defect touches only two adjacent knots, so a sparse NLP solver exploits the structure; single shooting has a dense Jacobian and its sensitivity to early controls grows exponentially with horizon length',
          'They avoid needing derivatives entirely',
          'They convert the problem into a convex one',
        ],
        answer: 1,
        explain:
          'Single shooting has few variables — just the controls — but the map from an early control to the terminal state is the composition of the entire flow, so the Jacobian is dense and, for unstable dynamics, exponentially badly conditioned. Collocation has many more variables but each constraint is local, giving a banded Jacobian a sparse interior-point solver handles in time linear in the horizon. It also lets you initialise the states with a physically sensible guess rather than hoping the shot lands nearby. More variables, a much better-conditioned problem: that trade is the reason transcription won.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m42_singular',
        q: 'In the Goddard rocket problem the optimal thrust sits strictly between its bounds for part of the flight. What is happening?',
        choices: [
          'The solver has not converged; the true optimum is bang-bang',
          'It is a singular arc: the switching function is identically zero over an interval, so minimising the Hamiltonian does not determine the control pointwise, and the control is instead fixed by requiring the time derivatives of the switching function to vanish',
          'The thrust bound is inactive because the constraint was written incorrectly',
          'The problem has multiple local optima and this is one of them',
        ],
        answer: 1,
        explain:
          'On a singular arc the coefficient of u in the Hamiltonian vanishes over a whole interval, so H carries no information about u there. The control is recovered by differentiating the switching function with respect to time — twice for the Goddard problem — until u appears explicitly, then solving for it. Physically the arc exists because drag grows with the square of velocity: flying at maximum thrust through the dense atmosphere buys speed that is immediately paid back in drag, so the optimum throttles to hold a velocity-dependent balance. Numerically, singular arcs are exactly where a direct solver produces chattering thrust, and the fix is mesh refinement at the junctions or a small regularisation.',
        b: 1.5,
        bloom: 'understand',
      },
      {
        id: 'q_m42_debug_nlp',
        q: 'IPOPT reports "restoration failed" after fifty iterations on your ascent problem. What is the most productive first move?',
        choices: [
          'Loosen the convergence tolerance until it reports success',
          'Check the scaling and the feasibility of the constraint set: non-dimensionalise states and controls to order one, relax or remove the terminal constraints to see whether any feasible trajectory exists at all, and warm start from the relaxed solution',
          'Switch to an indirect method',
          'Increase the number of mesh points until it converges',
        ],
        answer: 1,
        explain:
          'Restoration failure means the algorithm could not even reduce constraint violation, which almost always signals an infeasible or a catastrophically badly scaled problem — not a local-minimum issue. The standard checklist is: non-dimensionalise so that states, controls and constraint residuals are order one; verify the initial guess is dynamically plausible; drop the terminal constraints and re-solve to establish that anything feasible exists; reintroduce constraints one at a time, warm starting each time. Refining the mesh first makes a badly scaled problem larger and worse, and loosening the tolerance hides the failure rather than fixing it.',
        b: 1.4,
        bloom: 'apply',
      },
    ],
    cards: [
      {
        id: 'c_m42_bolza',
        front: 'Bolza, Mayer and Lagrange cost forms',
        back: 'Bolza: J = phi(x(tf), tf) + integral of L dt. Mayer: terminal term only. Lagrange: integral only. Any one converts to any other by adding a state whose derivative is L.',
        formula: true,
      },
      {
        id: 'c_m42_hamiltonian',
        front: 'The control Hamiltonian',
        back: 'H(x, u, p, t) = L(x, u, t) + p^T f(x, u, t). The costate p is the shadow price of the dynamic constraint.',
        formula: true,
      },
      {
        id: 'c_m42_euler_lagrange',
        front: 'Costate (adjoint) equation and its direction of integration',
        back: 'pdot = -dH/dx, integrated BACKWARD from the terminal condition p(tf) = dphi/dx(tf). The state goes forward, the costate goes backward — that is what makes it a two-point boundary value problem.',
        formula: true,
      },
      {
        id: 'c_m42_pmp',
        front: "Pontryagin's Minimum Principle",
        back: 'The optimal control at each instant minimises H over the admissible set U: u*(t) = argmin_{u in U} H(x*, u, p*, t). Stronger than dH/du = 0, because it still holds when the optimum is on a bound.',
        formula: true,
      },
      {
        id: 'c_m42_transversality',
        front: 'Free-final-time transversality condition',
        back: 'For a time-invariant problem with no explicit terminal time cost, H(tf) = 0. For a time-invariant problem H is constant along the whole optimal trajectory — a cheap numerical check on any solution.',
        formula: true,
      },
      {
        id: 'c_m42_switching',
        front: 'Switching function',
        back: 'For control-affine dynamics f = a(x) + B(x)u with no u in the running cost, s(t) = B(x)^T p. u sits on the bound opposite the sign of s. Sign changes of s are the switch times.',
        formula: true,
      },
      {
        id: 'c_m42_singular',
        front: 'Singular arc',
        back: 'An interval on which the switching function is identically zero, so the Minimum Principle does not determine u pointwise. Recover u by differentiating s in time until u appears explicitly. Goddard ascent and many low-thrust transfers have one.',
      },
      {
        id: 'c_m42_direct_vs_indirect',
        front: 'Direct vs indirect methods in one line',
        back: 'Indirect: derive the optimality conditions, then discretise (optimise-then-discretise). Direct: discretise the problem, then optimise the resulting NLP (discretise-then-optimise).',
      },
      {
        id: 'c_m42_trap_defect',
        front: 'Trapezoidal collocation defect',
        back: 'd_k = x_{k+1} - x_k - (h/2)(f_k + f_{k+1}). Second-order accurate globally; control is piecewise linear.',
        formula: true,
      },
      {
        id: 'c_m42_hs_defect',
        front: 'Hermite-Simpson defect (compressed form)',
        back: 'x_mid = (x_k + x_{k+1})/2 + (h/8)(f_k - f_{k+1}); d_k = x_{k+1} - x_k - (h/6)(f_k + 4 f_mid + f_{k+1}). Fourth-order globally.',
        formula: true,
      },
      {
        id: 'c_m42_pseudospectral',
        front: 'Pseudospectral node families',
        back: 'Legendre-Gauss (no endpoints), Legendre-Gauss-Radau (one endpoint — the usual choice for initial-value-style problems), Legendre-Gauss-Lobatto (both endpoints). Nodes cluster at the ends, which is what kills the Runge phenomenon.',
      },
      {
        id: 'c_m42_spectral_convergence',
        front: 'Spectral convergence and its precondition',
        back: 'Error decays faster than any power of 1/N — but only for a SMOOTH (analytic) solution. A switch, a constraint activation or a staging event drops it to algebraic, which is why hp-adaptive meshes break at junctions. Trapezoid stays O(h^2) and Hermite-Simpson O(h^4) regardless.',
      },
      {
        id: 'c_m42_covector',
        front: 'Covector mapping theorem',
        back: 'The KKT multipliers of the discretised problem map, under the right node set and scaling, to the costates of the continuous problem. It lets a direct solution be verified against the Minimum Principle.',
      },
      {
        id: 'c_m42_scaling',
        front: 'The two standard fixes for a trajectory NLP that will not converge',
        back: 'First, non-dimensionalise: get states, controls, constraint residuals and cost to order one, since a problem in metres, kilograms and seconds carries condition numbers of 1e9 and fails restoration before it fails to find the optimum. Second, homotopy: solve an easy version (more thrust, no path constraints, shorter horizon) and sweep a parameter toward the real problem, warm starting each solve from the last.',
      },
    ],
    tags: ['interview', 'math'],
    importance: 1.2,
  },

  {
    id: 't5_m43_convex_guidance',
    track: 'gnc',
    tier: 5,
    title: 'Convex Optimization for Guidance (Powered Descent)',
    summary:
      'Take the minimum-fuel powered-descent problem, prove away its non-convexities, and solve it as a second-order cone program a flight computer can be certified to finish in bounded time. You will implement lossless convexification and verify its tightness numerically, build the two-stage minimum-landing-error G-FOLD solve and plot a landing footprint, then run successive convexification with trust regions and virtual controls on a 6-DoF landing.',
    prereqs: ['t5_m42_trajectory_optimization', 't0_m11_optimization', 't2_m24_edl'],
    hours: 95,
    topics: [
      'The certification argument: why onboard guidance demands a solver with a convergence guarantee and a bounded iteration count, and why a general NLP cannot give one',
      'The minimum-fuel powered descent problem and its four non-convexities: the lower thrust bound, mass-depletion dynamics, thrust pointing, and logic-triggered constraints',
      'Why the thrust magnitude constraint rho_min <= ||T|| <= rho_max is non-convex — the feasible set is an annulus with the origin removed',
      'Lossless convexification: the slack variable Gamma with ||T|| <= Gamma and rho_min <= Gamma <= rho_max, and the proof sketch via the maximum principle that the relaxation is tight',
      'The change of variables u = T/m, sigma = Gamma/m, z = ln m, and how it makes the translational dynamics exactly linear',
      'The second-order-expanded mass bounds that keep the transformed thrust bounds convex',
      'SOCP standard form, the second-order cone, and mapping the powered-descent problem onto it',
      'G-FOLD (Guidance for Fuel-Optimal Large Diverts) and the two-stage minimum-landing-error then minimum-fuel solve',
      'The JPL/Masten Xombie flight demonstrations of G-FOLD and what they proved',
      'Glideslope, velocity, and thrust-pointing constraints as cones',
      'Flight time as the one non-convex parameter, and solving it by a line search over an inner SOCP',
      'Discrete-time lossless convexification and what survives discretisation',
      'Successive convexification (SCvx): linearise about a reference, solve, update, repeat',
      'Trust regions and artificial unboundedness; virtual control (virtual buffers) and artificial infeasibility',
      'The convergence ratio rho and the accept/reject/resize rule',
      'Free-final-time formulation by time dilation, and the notation clash with the thrust slack',
      '6-DoF powered descent with quaternion attitude inside the optimization',
      'State-triggered constraints for logic in the loop, and compound STCs',
      'GuSTO and the broader sequential convex programming convergence theory',
      'Real-time implementation: solver code generation, iteration bounds, warm starting, and fixed-point considerations',
      'How all of this maps onto a Falcon 9 entry burn / aero phase / landing burn architecture, and onto Starship landing',
    ],
    objectives: [
      'Derive the lossless convexification of the 3-DoF minimum-fuel landing problem and explain exactly why the relaxation recovers the true optimum',
      'Implement the transformed dynamics and thrust bounds, solve the SOCP in CVXPY, and verify numerically that ||u|| = sigma at every node',
      'Build minimum-landing-error G-FOLD and plot the reachable landing footprint as a function of initial state and propellant',
      'Implement SCvx with a trust region and virtual control for a 6-DoF landing with free final time, converging from a straight-line initial guess',
      'Reason quantitatively about an onboard solve budget: iterations, worst-case time, warm-start policy, and what happens when the solver does not converge in time',
      'Explain a state-triggered constraint and write one for a realistic aerodynamic case',
    ],
    resources: [
      {
        title: 'Convex Programming Approach to Powered Descent Guidance for Mars Landing',
        author: 'Acikmese & Ploen, JGCD 30(5):1353-1366, 2007',
        kind: 'paper',
        url: 'https://doi.org/10.2514/1.27553',
        free: false,
        note: 'The foundational lossless convexification paper. Read it line by line; everything else in this module descends from it.',
      },
      {
        title:
          'Convex Optimization for Trajectory Generation: A Tutorial on Generating Dynamically Feasible Trajectories Reliably and Efficiently',
        author: 'Malyuta, Reynolds, Szmuk, Lew, Bonalli, Pavone & Acikmese, IEEE Control Systems Magazine 42(5):40-113, 2022',
        kind: 'paper',
        url: 'https://arxiv.org/abs/2106.09125',
        free: true,
        note: 'The single most valuable document in this curriculum. Seventy pages by the people who invented LCvx, SCvx and GuSTO, tutorial style, with code.',
      },
      {
        title: 'Lossless Convexification of Nonconvex Control Bound and Pointing Constraints of the Soft Landing Optimal Control Problem',
        author: 'Acikmese, Carson & Blackmore, IEEE Transactions on Control Systems Technology, 2013',
        kind: 'paper',
        free: false,
        note: 'The pointing-constraint extension and the cleanest statement of the tightness conditions.',
      },
      {
        title: 'Minimum-Landing-Error Powered-Descent Guidance for Mars Landing Using Convex Optimization',
        author: 'Blackmore, Acikmese & Scharf, JGCD, 2010',
        kind: 'paper',
        free: false,
        note: 'The G-FOLD two-stage formulation: minimise landing error first, then minimise fuel subject to that error.',
      },
      {
        title: 'Successive Convexification for 6-DoF Mars Rocket Powered Landing with Free-Final-Time',
        author: 'Szmuk & Acikmese',
        kind: 'paper',
        url: 'https://arxiv.org/abs/1802.03827',
        free: true,
      },
      {
        title: 'Successive Convexification for Real-Time 6-DoF Powered Descent Guidance with State-Triggered Constraints',
        author: 'Reynolds, Szmuk, Malyuta, Mesbahi, Acikmese & Carson',
        kind: 'paper',
        url: 'https://arxiv.org/abs/1811.10803',
        free: true,
      },
      {
        title: 'Real-Time Quad-Rotor Path Planning Using Convex Optimization and Compound State-Triggered Constraints',
        author: 'Szmuk, Reynolds, Acikmese, Mesbahi & Carson',
        kind: 'paper',
        url: 'https://arxiv.org/abs/1901.02181',
        free: true,
        note: 'Compound STCs — how to write logical AND/OR of trigger conditions inside a continuous optimization.',
      },
      {
        title: 'Propellant-Optimal Powered Descent Guidance Revisited',
        author: 'Ping Lu, JGCD 46(2), 2023',
        kind: 'paper',
        free: false,
        note: 'The indirect counterpoint. Read it against Acikmese to argue both sides of the convergence-guarantee versus optimality trade.',
      },
      {
        title: 'A Survey on Convex Optimization for Guidance and Control of Vehicular Systems',
        kind: 'paper',
        url: 'https://arxiv.org/abs/2311.05115',
        free: true,
      },
      {
        title: 'SCvx reference implementation (free-final-time 6-DoF landing)',
        author: 'EmbersArc',
        kind: 'tool',
        url: 'https://github.com/EmbersArc/SCvx',
        free: true,
        note: 'Readable Python. Compare it line by line against Szmuk & Acikmese.',
      },
      {
        title: 'CVXPY',
        kind: 'tool',
        url: 'https://www.cvxpy.org/',
        free: true,
        note: 'Disciplined convex programming in Python, with ECOS and Clarabel behind it.',
      },
      {
        title: 'Convex Optimization',
        author: 'Boyd & Vandenberghe',
        kind: 'book',
        url: 'https://web.stanford.edu/~boyd/cvxbook/',
        free: true,
        note: 'Chapters 4 and 11 for cone programs and interior-point methods. Free PDF from the authors.',
      },
    ],
    exercises: [
      {
        id: 'ex_m43_lcvx',
        title: 'Lossless convexification, built piece by piece',
        kind: 'code',
        lang: 'python',
        hours: 16,
        prompt: `Build the transformation that turns minimum-fuel powered descent into a convex problem, one function at a time, then use it inside CVXPY.

The vehicle obeys

  rddot = g + T/m,   mdot = -alpha ||T||,   rho_min <= ||T|| <= rho_max

with alpha = 1/(Isp g0). The lower thrust bound makes the feasible set an annulus, which is not convex, and T/m makes the dynamics bilinear.

1. Implement **alpha_from_isp**.
2. Implement **lcvx_variables**: the change of variables u = T/m, sigma = Gamma/m, z = ln m. Note that under it the dynamics become rddot = g + u and zdot = -alpha sigma — **exactly linear**.
3. Implement **mass_bound_coeffs** and **thrust_bounds_convex**. Expanding about the reference log-mass z0(t) = ln(m_wet - alpha rho_max t), the transformed bounds that stay convex are

   mu1 [1 - (z - z0) + (z - z0)^2 / 2]  <=  sigma  <=  mu2 [1 - (z - z0)]

   with mu1 = rho_min exp(-z0) and mu2 = rho_max exp(-z0). Convince yourself the left side is a convex quadratic and the right side is affine, so both inequalities are convex.
4. Implement **propagate**, one zero-order-hold step of the transformed dynamics.
5. Implement **relaxation_gap** and use it: solve the relaxed SOCP in CVXPY with the slack constraint ||u|| <= sigma, then check that sigma - ||u|| is zero at every node to solver tolerance. That is lossless convexification working — the relaxed optimum was feasible for the original non-convex problem all along.

Success: every test passes, your CVXPY solve returns a relaxation gap below 1e-6, and you can state the tightness argument out loud in under a minute.`,
        starter: `import numpy as np

G0 = 9.80665


def alpha_from_isp(isp, g0=G0):
    """Mass-flow coefficient alpha = 1 / (Isp * g0), in s/m."""
    raise NotImplementedError


def lcvx_variables(T, m):
    """Change of variables for lossless convexification.

    T : (3,) thrust vector, N
    m : mass, kg

    Returns (u, sigma, z) = (T/m, ||T||/m, ln m).
    """
    raise NotImplementedError


def mass_bound_coeffs(m_wet, alpha, rho_min, rho_max, t):
    """Reference log-mass and the transformed thrust-bound coefficients at time t.

    Returns (z0, mu1, mu2) with
        z0  = ln(m_wet - alpha * rho_max * t)
        mu1 = rho_min * exp(-z0)
        mu2 = rho_max * exp(-z0)
    """
    raise NotImplementedError


def thrust_bounds_convex(z, z0, mu1, mu2):
    """Convex lower and upper bounds on sigma at log-mass z.

    lower = mu1 * (1 - (z - z0) + (z - z0)**2 / 2)
    upper = mu2 * (1 - (z - z0))
    """
    raise NotImplementedError


def propagate(r, v, z, u, sigma, g, alpha, dt):
    """One zero-order-hold step of the convexified dynamics.

    Returns (r_next, v_next, z_next) with
        r+ = r + v*dt + 0.5*(g + u)*dt**2
        v+ = v + (g + u)*dt
        z+ = z - alpha*sigma*dt
    """
    raise NotImplementedError


def relaxation_gap(u, sigma):
    """Largest sigma_k - ||u_k|| over the nodes.

    u     : (N, 3) transformed thrust accelerations
    sigma : (N,)   slack variables

    A gap of zero means the relaxation was tight and the solution is feasible
    for the original non-convex problem.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'alpha and the change of variables',
            assert: `import numpy as np
a = alpha_from_isp(300.0)
assert abs(a - 1.0 / (300.0 * 9.80665)) < 1e-15, "alpha = 1/(Isp*g0)"
u, sigma, z = lcvx_variables(np.array([0.0, 0.0, 1000.0]), 2000.0)
assert np.allclose(u, [0.0, 0.0, 0.5]), "u = T/m"
assert abs(sigma - 0.5) < 1e-12, "sigma = ||T||/m"
assert abs(z - np.log(2000.0)) < 1e-12, "z = ln m"`,
          },
          {
            name: 'mass bound coefficients collapse to the wet-mass values at t = 0',
            assert: `import numpy as np
alpha = alpha_from_isp(225.0)
z0, mu1, mu2 = mass_bound_coeffs(1905.0, alpha, 4972.0, 13260.0, 0.0)
assert abs(z0 - np.log(1905.0)) < 1e-12, "at t=0 the reference mass is the wet mass"
assert abs(mu1 - 4972.0 / 1905.0) < 1e-9, "mu1 = rho_min / m_ref"
assert abs(mu2 - 13260.0 / 1905.0) < 1e-9, "mu2 = rho_max / m_ref"
z0b, _, _ = mass_bound_coeffs(1905.0, alpha, 4972.0, 13260.0, 20.0)
assert z0b < z0, "the reference mass must fall with time"`,
          },
          {
            name: 'the convex bounds are exact at the reference and tighten for a heavier vehicle',
            assert: `import numpy as np
z0, mu1, mu2 = 7.5, 2.6, 7.0
lo, hi = thrust_bounds_convex(z0, z0, mu1, mu2)
assert abs(lo - mu1) < 1e-12 and abs(hi - mu2) < 1e-12, "bounds must be exact at z = z0"
lo2, hi2 = thrust_bounds_convex(z0 + 0.1, z0, mu1, mu2)
assert hi2 < hi, "a heavier vehicle has less acceleration authority"
assert lo2 < lo, "and a lower minimum acceleration"`,
          },
          {
            name: 'the transformed dynamics are exactly linear under a hover command',
            assert: `import numpy as np
g = np.array([0.0, 0.0, -3.7114])
r = np.array([100.0, 50.0, 1500.0])
v = np.array([-20.0, 0.0, -75.0])
z = np.log(1700.0)
alpha = alpha_from_isp(225.0)
u = -g
sigma = float(np.linalg.norm(u))
r1, v1, z1 = propagate(r, v, z, u, sigma, g, alpha, 1.0)
assert np.allclose(v1, v, atol=1e-12), "thrust cancelling gravity leaves velocity unchanged"
assert np.allclose(r1, r + v, atol=1e-12), "position advances linearly"
assert abs(z1 - (z - alpha * sigma)) < 1e-12, "zdot = -alpha*sigma"`,
          },
          {
            name: 'the relaxation gap detects a slack solution',
            assert: `import numpy as np
u = np.array([[0.0, 0.0, 4.0], [1.0, 0.0, 3.0]])
tight = np.linalg.norm(u, axis=1)
assert abs(relaxation_gap(u, tight)) < 1e-12, "sigma = ||u|| must report a zero gap"
loose = tight + np.array([0.0, 0.25])
assert abs(relaxation_gap(u, loose) - 0.25) < 1e-12, "a slack node must be reported"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m43_gfold',
        title: 'G-FOLD: minimum landing error, then minimum fuel, then the footprint',
        kind: 'build',
        hours: 24,
        prompt: `Build the full two-stage G-FOLD solve in CVXPY on the Mars-lander parameters from Acikmese & Ploen, then use it to map a landing footprint.

**Stage 1 — minimum landing error.** Minimise the distance from the touchdown point to the target, subject to the transformed dynamics, the convexified thrust bounds, the glideslope cone, a thrust-pointing cone, and the propellant available. Call the optimum d*.

**Stage 2 — minimum fuel.** Minimise propellant (equivalently, maximise terminal z) subject to landing error <= d*. This is the part that matters: if the target is reachable, d* is zero and stage 2 is the fuel-optimal solution to the target; if it is not reachable, stage 2 spends the least fuel getting as close as stage 1 proved possible.

Then:
1. Flight time is the only parameter that is not convex. Wrap both stages in a golden-section line search over tf and plot cost against tf — you should see a single well-defined minimum.
2. Sweep initial downrange position and initial velocity, record which cases return d* = 0, and plot the **reachable landing footprint**. Overlay the footprint for two propellant loads.
3. Add the glideslope constraint as a second-order cone and show the footprint shrink.
4. Report the relaxation gap for every solve in the sweep; if it is ever non-zero, find out why.

Success: a footprint plot from at least 200 converged solves, all with a relaxation gap below 1e-6, and a written paragraph on why the two-stage structure is the right way to pose "land as close as you can, as cheaply as you can".`,
      },
      {
        id: 'ex_m43_scvx',
        title: 'The SCvx machinery: virtual control and the trust-region rule',
        kind: 'code',
        lang: 'python',
        hours: 14,
        prompt: `Successive convexification is a loop: linearise the non-convex problem about the current reference, solve the resulting convex subproblem, decide whether to accept the step, resize the trust region, repeat. Two devices make it work, and both exist to stop the subproblem lying to you.

**Virtual control** is an unconstrained additive term in the linearised dynamics, heavily penalised in the cost. Without it, a linearisation about a poor reference can be *infeasible* even though the true non-convex problem is perfectly feasible — artificial infeasibility — and the solver returns nothing at all. With it, every subproblem is feasible by construction, and a non-zero virtual control at the solution is a signal telling you the linearisation is bad there.

**The trust region** bounds the deviation from the reference. Without it, the linearised dynamics can be exploited far from the reference where they are meaningless, giving a subproblem whose optimum is unbounded or wildly wrong — artificial unboundedness.

1. Implement **virtual_control**: the residual that makes a linearised step exact.
2. Implement **penalised_cost**: the subproblem objective, original cost plus a weighted one-norm of the virtual control.
3. Implement **trust_region_update**: the standard accept/reject/resize rule keyed on rho, the ratio of actual to predicted cost reduction.
4. Then wire them into a full SCvx solve of the 6-DoF free-final-time landing (start from the EmbersArc reference implementation if you need scaffolding) and plot the virtual-control norm and trust-region radius against iteration. Both should fall toward zero; when the virtual control is numerically zero the iterate is dynamically feasible for the true nonlinear system.

Success: tests pass, the 6-DoF problem converges from a straight-line initial guess in fewer than twenty iterations, and you can explain the difference between artificial infeasibility and artificial unboundedness without notes.`,
        starter: `import numpy as np


def virtual_control(x_next, A, x, B, u, c):
    """Residual that makes the linearised step exact.

    nu = x_next - (A @ x + B @ u + c)

    A non-zero nu at the subproblem optimum means the linearisation about the
    reference cannot reproduce the commanded transition.
    """
    raise NotImplementedError


def penalised_cost(cost, nus, weight):
    """Subproblem objective: original cost plus weight * sum of one-norms of nus.

    cost   : scalar original objective value
    nus    : (N, n) virtual controls, one row per step
    weight : penalty weight (large)
    """
    raise NotImplementedError


def trust_region_update(rho, radius, rho0=0.0, rho1=0.25, rho2=0.7,
                        alpha=2.0, beta=2.0, r_min=1e-3, r_max=10.0):
    """Standard SCvx trust-region rule.

    rho is the ratio of actual to predicted reduction in the penalised cost.

        rho <  rho0            : reject the step, radius / alpha
        rho0 <= rho < rho1     : accept,          radius / alpha
        rho1 <= rho < rho2     : accept,          radius unchanged
        rho >= rho2            : accept,          radius * beta

    Clip the new radius to [r_min, r_max].

    Returns (accept, new_radius) with accept a bool.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'virtual control vanishes on an exactly linear step',
            assert: `import numpy as np
A = np.array([[1.0, 0.1], [0.0, 1.0]])
B = np.array([[0.005], [0.1]])
c = np.array([0.0, -0.981])
x = np.array([100.0, -5.0])
u = np.array([2.0])
x_next = A @ x + B @ u + c
nu = virtual_control(x_next, A, x, B, u, c)
assert np.allclose(nu, 0.0, atol=1e-12), "an exact linear step needs no virtual control"
nu2 = virtual_control(x_next + np.array([0.0, 0.3]), A, x, B, u, c)
assert np.allclose(nu2, [0.0, 0.3], atol=1e-12), "nu must report the shortfall"`,
          },
          {
            name: 'the penalty is a weighted one-norm',
            assert: `import numpy as np
nus = np.array([[0.0, 0.2], [-0.1, 0.0]])
val = penalised_cost(10.0, nus, 100.0)
assert abs(val - (10.0 + 100.0 * 0.3)) < 1e-12, "expected cost + weight * sum|nu|, got %r" % val
assert abs(penalised_cost(10.0, np.zeros((4, 3)), 1e5) - 10.0) < 1e-12, "zero virtual control costs nothing"`,
          },
          {
            name: 'trust region rejects a bad step and shrinks',
            assert: `accept, r = trust_region_update(-0.5, 2.0)
assert accept is False, "a step that made the cost worse must be rejected"
assert abs(r - 1.0) < 1e-12, "and the radius must shrink by alpha"`,
          },
          {
            name: 'trust region grows only on a well-predicted step',
            assert: `a1, r1 = trust_region_update(0.1, 2.0)
assert a1 is True and abs(r1 - 1.0) < 1e-12, "accepted but poorly predicted: accept and shrink"
a2, r2 = trust_region_update(0.5, 2.0)
assert a2 is True and abs(r2 - 2.0) < 1e-12, "moderately predicted: keep the radius"
a3, r3 = trust_region_update(0.95, 2.0)
assert a3 is True and abs(r3 - 4.0) < 1e-12, "well predicted: grow by beta"`,
          },
          {
            name: 'the radius is clipped at both ends',
            assert: `_, r_big = trust_region_update(0.99, 8.0, r_max=10.0)
assert abs(r_big - 10.0) < 1e-12, "radius must clip at r_max"
_, r_small = trust_region_update(-1.0, 1.5e-3, r_min=1e-3)
assert abs(r_small - 1e-3) < 1e-12, "radius must clip at r_min"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m43_realtime',
        title: 'Can it close the loop? A solve-time budget',
        kind: 'analysis',
        hours: 8,
        prompt: `Guidance that is optimal but late is not guidance. Work out whether yours would fly.

1. Profile your G-FOLD SOCP: solve time against node count N, for N from 20 to 200, on one core, using ECOS or Clarabel. Fit the scaling. Record the interior-point iteration count, not just wall time — that is the number that has a theoretical bound.
2. Choose a guidance rate (say 1-2 Hz for powered descent) and a node count that meets the accuracy you need. State the worst-case solve time you observed over 1000 dispersed initial conditions, not the mean.
3. Write the fallback policy: what does the vehicle fly on the cycle where the solver does not return in time? (The honest answers are: hold the previously computed solution and re-plan next cycle; fall back to a closed-form polynomial or ZEM/ZEV law; or declare a fault. Pick one and defend it.)
4. Quantify warm starting: re-solve each cycle from the previous cycle's solution and report the reduction in iteration count.
5. One paragraph: why does a bounded iteration count let a certification authority accept this algorithm when a sequential quadratic programming solve of the same problem would not be accepted?

Success: a plot of solve time and iteration count against N, a stated worst case with a margin against the guidance period, and a written fallback policy you would be willing to defend in a design review.`,
      },
    ],
    quiz: [
      {
        id: 'q_m43_nonconvex_bound',
        q: 'Why is the thrust constraint rho_min <= ||T|| <= rho_max non-convex?',
        choices: [
          'Because the norm is not differentiable at the origin',
          'Because the feasible set is a spherical annulus: the upper bound is a convex ball, but the lower bound excludes an interior region, so the midpoint of two feasible thrust vectors pointing in opposite directions is infeasible',
          'Because thrust and mass are coupled',
          'Because rho_min is a function of time',
        ],
        answer: 1,
        explain:
          'The set {T : ||T|| <= rho_max} is a ball and is convex. The set {T : ||T|| >= rho_min} is the complement of an open ball and is not: take T and -T both of magnitude rho_min; their average is zero, which violates the lower bound. The physical origin of the lower bound is that a liquid engine cannot be throttled arbitrarily low and, on many vehicles, cannot be shut down and restarted, so it must produce at least rho_min whenever it is running. This one constraint is what makes powered descent hard, and lossless convexification is the entire answer to it.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'q_m43_lcvx',
        q: 'How does lossless convexification relax the lower thrust bound while provably recovering the optimum of the original problem?',
        choices: [
          'It drops the lower bound and post-processes the answer by clipping the thrust magnitude',
          'It introduces a slack variable Gamma with the convex constraints ||T|| <= Gamma and rho_min <= Gamma <= rho_max, replaces ||T|| by Gamma everywhere else in the problem, and proves via the maximum principle that the relaxed optimum satisfies ||T|| = Gamma almost everywhere',
          'It replaces the annulus by its convex hull and accepts the resulting suboptimality',
          'It solves a sequence of convex problems whose limit satisfies the original constraint',
        ],
        answer: 1,
        explain:
          'The slack lifts the problem into a higher-dimensional space where the feasible set is convex: the pair (T, Gamma) lives in a second-order cone intersected with a slab. The relaxation would be useless if its solution had ||T|| strictly below Gamma, because then the trajectory would not correspond to any real thrust programme. The theorem says that cannot happen on a set of positive measure: since mass depletion is driven by Gamma and the cost is strictly increasing in propellant, any interior arc could be improved by lowering Gamma, which the maximum principle conditions forbid at an optimum. So the relaxed solution is feasible for and optimal for the original non-convex problem — not an approximation of it. Controllability of the linearised dynamics is the technical condition.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m43_logmass',
        q: 'Why substitute z = ln m and u = T/m?',
        choices: [
          'To improve numerical conditioning only; the problem is convex either way',
          'Because the original dynamics contain T/m, which is bilinear in the decision variables, whereas after the substitution the translational dynamics rddot = g + u and zdot = -alpha sigma are exactly linear — the non-convexity moves entirely into the thrust bounds, where it can be handled by a convex expansion',
          'Because mass must stay positive and the logarithm enforces that automatically',
          'Because it turns the second-order cone into a linear constraint',
        ],
        answer: 1,
        explain:
          'The product T/m is the structural problem: with both T and m as decision variables the dynamics are bilinear and the constraint set is not convex. Taking u as the acceleration command instead of the force makes the translational equation linear with constant coefficients. Taking z as the logarithm of mass makes the mass equation linear too, because mdot/m is the derivative of ln m. The price is that the thrust bounds, which were simple in T, become exponential in z; those are then handled by expanding about a reference log-mass, keeping a convex quadratic lower bound and an affine upper bound. Positivity of mass does come out for free, but that is a side benefit, not the reason.',
        b: 1.3,
        bloom: 'understand',
      },
      {
        id: 'q_m43_virtual_control',
        q: 'In successive convexification, what is a virtual control and what specific failure does it prevent?',
        choices: [
          'A relaxation of the actuator limits that keeps the control within bounds',
          'An unconstrained, heavily penalised additive term in the linearised dynamics that guarantees every convex subproblem is feasible, preventing artificial infeasibility — the case where the linearisation about a poor reference admits no solution even though the true non-convex problem is feasible',
          'A fictitious control used to estimate the Jacobian by finite differences',
          'The difference between the commanded and achieved control, used for integral action',
        ],
        answer: 1,
        explain:
          'Linearising nonlinear dynamics about a bad reference can produce a convex subproblem with an empty feasible set: the linear model simply cannot get from the initial to the terminal state under the imposed constraints. The solver then returns infeasible and the iteration dies, even though the original problem has a perfectly good solution. Adding an unconstrained slack to the dynamics makes the subproblem feasible by construction; the large penalty drives that slack to zero as the reference improves. Its norm doubles as a diagnostic: where the virtual control is large, the linearisation is poor, and at convergence it must be numerically zero or the trajectory is not dynamically feasible for the real system.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m43_trust_region',
        q: 'What does the trust region in SCvx protect against, and how is its size chosen?',
        choices: [
          'Against artificial unboundedness — the linearised subproblem exploiting a model that is only valid near the reference — with the radius resized each iteration by the ratio of actual to predicted cost reduction: shrink on a poor ratio, grow on a good one',
          'Against the solver taking too many interior-point iterations',
          'Against the trajectory violating the thrust bounds',
          'Against numerical overflow in the state variables',
        ],
        answer: 0,
        explain:
          'Far from the reference, the linearised dynamics are fiction, and an optimiser will happily drive into that fiction to reduce cost; in the worst case the subproblem is unbounded. Constraining the deviation from the reference keeps the iterate where the model is trustworthy. The update rule is borrowed from classical trust-region nonlinear programming: compute rho as the ratio of the actual reduction in the true penalised cost to the reduction the convex model predicted; reject and shrink if rho is negative, accept and shrink if it is small, keep if it is moderate, accept and grow if the model predicted well. Virtual control and trust region are complementary — one guarantees the subproblem has a solution, the other guarantees the solution means something.',
        b: 1.4,
        bloom: 'analyze',
      },
      {
        id: 'q_m43_why_convex_flies',
        q: 'Why would a flight programme accept a convex SOCP guidance algorithm but reject a general nonlinear programming one, even if the NLP found better trajectories in testing?',
        choices: [
          'Because SOCPs are faster in every case',
          'Because a convex problem has no local minima and interior-point methods solve it to a prescribed accuracy in a number of iterations that can be bounded a priori, so the onboard worst-case execution time is provable rather than empirical; a general NLP can stall, find a local minimum, or fail to converge at all, and no amount of testing proves it will not',
          'Because convex solvers are simpler to code and therefore have fewer bugs',
          'Because NLP solvers require floating point and SOCP solvers can use fixed point',
        ],
        answer: 1,
        explain:
          'This is the core certification argument and the reason this whole field exists. Flight software must have a bounded worst-case execution time and a deterministic outcome. Convexity gives both: any local optimum is global, and interior-point methods have polynomial iteration complexity with practical iteration counts in the tens, essentially independent of the data. A general NLP has none of these guarantees — it can converge to a poor local minimum, cycle, or hit an iteration limit with nothing usable, and its behaviour on the one dispersed case you did not test is unknown. Testing can raise confidence in an NLP; only convexity turns it into a proof. Smaller code and fixed-point implementability are real secondary benefits, not the argument.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'q_m43_stc',
        q: 'What is a state-triggered constraint, and what problem does it solve?',
        choices: [
          'A constraint activated by the ground operator during flight',
          'A continuous formulation of if-then logic — the constraint is enforced only where a trigger function of the state is satisfied — so conditional behaviour can be embedded in a continuous optimization without introducing integer variables and turning the problem into a mixed-integer programme',
          'A constraint on the rate of change of the state',
          'A soft constraint whose weight varies with the state',
        ],
        answer: 1,
        explain:
          'Real vehicles have logic: enforce an angle-of-attack limit only while dynamic pressure is high; enforce a plume-impingement keep-out only below some altitude; require the landing legs deployed only inside a velocity envelope. Expressing that with binaries makes the problem mixed-integer and destroys the convexity that bought the convergence guarantee. A state-triggered constraint encodes the implication with a smooth product of a trigger function and a constraint function — typically using the negative part of the trigger as a multiplier — so the constraint switches on continuously and the problem stays continuous. Compound STCs extend this to logical AND and OR of several triggers.',
        b: 1.5,
        bloom: 'understand',
      },
      {
        id: 'q_m43_final_time',
        q: 'In the 3-DoF convex powered descent formulation, flight time tf is the one parameter that is not handled convexly. How is it dealt with?',
        choices: [
          'It is fixed at a value chosen offline and never varied',
          'It is added to the decision vector; the problem stays an SOCP',
          'The inner problem is solved as an SOCP for a fixed tf and an outer one-dimensional search — usually golden section or a simple bisection on the cost gradient — is run over tf, which is cheap because the cost behaves unimodally in tf',
          'It is eliminated by normalising time to [0, 1], which removes the dependence entirely',
        ],
        answer: 2,
        explain:
          'The discretised dynamics matrices depend on tf, so making tf a variable destroys the conic structure. The practical answer is a line search: for each candidate tf, solve one SOCP; the optimal cost as a function of tf is well behaved with a single interior minimum, so golden-section converges in a dozen or so solves. That is affordable because each inner solve is tens of milliseconds. Normalising time to the unit interval does not remove the dependence, it just moves tf into the dynamics as a scale factor — which is precisely what SCvx exploits as time dilation, where the dilation factor becomes a decision variable and the linearisation handles the resulting nonlinearity.',
        b: 1.6,
        bloom: 'apply',
      },
      {
        id: 'q_m43_lu_contrast',
        q: 'Ping Lu argues for an indirect, root-finding approach to propellant-optimal powered descent. How does that contrast with the convex approach?',
        choices: [
          'Lu finds different optimal trajectories; the two methods disagree on the physics',
          'The indirect method solves the necessary conditions directly, giving very high accuracy and a tiny computational footprint when it converges, but its convergence depends on the root-finding iteration and the assumed thrust structure; the convex approach accepts a slightly larger problem to buy a guaranteed, bounded-iteration solve from any feasible starting point',
          'The convex approach is only valid for Mars, the indirect only for Earth',
          'The indirect method cannot handle the lower thrust bound',
        ],
        answer: 1,
        explain:
          'Both are solving the same optimal control problem and at the optimum they agree — the convex solution satisfies the maximum principle conditions the indirect method solves directly, which is a useful cross-check. The difference is engineering, not physics. The indirect formulation reduces the problem to a small set of nonlinear equations in a few unknowns, which is extremely fast and accurate, but the Newton iteration has no global convergence guarantee and structural assumptions about the thrust profile have to be verified. The convex formulation is larger but deterministic. A mature programme often carries both: the convex solver onboard and the indirect solution as the ground-based truth reference against which onboard optimality is verified.',
        b: 1.9,
        bloom: 'analyze',
      },
      {
        id: 'q_m43_gfold_two_stage',
        q: 'Why does G-FOLD solve two problems in sequence rather than one weighted problem that trades landing error against fuel?',
        choices: [
          'Because a weighted objective is not convex',
          'Because the two-stage form answers the operationally correct question without needing a weight: stage one establishes the smallest achievable landing error given the propellant, and stage two then minimises propellant subject to achieving that error, so the vehicle never trades away accuracy it could have had and never spends fuel it does not need',
          'Because the solver cannot handle two objectives at once',
          'Because the fuel cost is not known until the landing site is fixed',
        ],
        answer: 1,
        explain:
          'A weighted sum requires choosing a number of metres per kilogram of propellant, which nobody can defend and which changes meaning with the dispersion. The lexicographic two-stage form removes the choice. Stage one minimises the terminal position error, which is a convex objective over the same feasible set and answers "is the target even reachable?". If the optimum is zero, the target is reachable and stage two returns the fuel-optimal trajectory to it. If the optimum is positive, the target is out of reach and stage two lands as close as physically possible while spending the least propellant to do it — exactly the behaviour you want from a diverting lander. Both stages are SOCPs, so this costs one extra solve.',
        b: 1.3,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m43_why_convex',
        front: 'The one-sentence case for convex onboard guidance',
        back: 'Any local optimum is global, and an interior-point method reaches a prescribed accuracy in an iteration count that can be bounded a priori — so worst-case execution time and convergence are provable, not merely tested.',
      },
      {
        id: 'c_m43_nonconvexity',
        front: 'Why rho_min <= ||T|| <= rho_max is non-convex',
        back: 'The set is a spherical annulus. The upper bound is a ball (convex); the lower bound removes an interior region, so the average of two opposed feasible thrusts is infeasible. It exists because a liquid engine has a minimum throttle and often cannot be restarted.',
      },
      {
        id: 'c_m43_slack',
        front: 'The lossless convexification slack',
        back: 'Introduce Gamma with ||T|| <= Gamma and rho_min <= Gamma <= rho_max, and use Gamma (not ||T||) in the mass dynamics and the cost. The pair (T, Gamma) lives in a convex set.',
        formula: true,
      },
      {
        id: 'c_m43_tightness',
        front: 'Why the LCvx relaxation is tight',
        back: 'Mass depletion is driven by Gamma and the cost is strictly increasing in propellant, so an arc with ||T|| < Gamma could be improved by lowering Gamma. The maximum principle forbids that at an optimum, so ||T|| = Gamma almost everywhere. Requires controllability of the linearised dynamics.',
      },
      {
        id: 'c_m43_change_of_vars',
        front: 'The LCvx change of variables',
        back: 'u = T/m, sigma = Gamma/m, z = ln m. Then rddot = g + u and zdot = -alpha sigma — exactly linear, with all remaining nonlinearity pushed into the thrust bounds. alpha = 1/(Isp g0); for Isp = 300 s, alpha = 3.399e-4 s/m.',
        formula: true,
      },
      {
        id: 'c_m43_mass_bounds',
        front: 'Convexified thrust bounds in log-mass',
        back: 'mu1 [1 - (z - z0) + (z - z0)^2 / 2] <= sigma <= mu2 [1 - (z - z0)], with z0 the reference log-mass, mu1 = rho_min e^{-z0}, mu2 = rho_max e^{-z0}. Left side convex quadratic, right side affine.',
        formula: true,
      },
      {
        id: 'c_m43_cones',
        front: 'The two cone constraints of powered descent',
        back: 'Pointing: nhat^T u >= sigma cos(theta_max), linear in u and sigma. Glideslope: ehat_up^T (r - r_target) >= tan(gamma_gs) ||H (r - r_target)||, with H projecting onto the horizontal — a cone about the landing site keeping the vehicle above terrain and inside the sensor field of view.',
        formula: true,
      },
      {
        id: 'c_m43_gfold',
        front: 'G-FOLD and its two stages',
        back: 'Guidance for Fuel-Optimal Large Diverts. Stage 1: minimise landing error, giving d*. Stage 2: minimise propellant subject to landing error <= d*. Lexicographic, so no error-vs-fuel weight has to be invented. Flight-demonstrated by JPL on the Masten Xombie vehicle.',
      },
      {
        id: 'c_m43_tf',
        front: 'How flight time is handled in the convex 3-DoF formulation',
        back: 'It is not a convex variable — the discretisation matrices depend on it. Fix tf, solve the SOCP, and run a golden-section search on tf outside. The cost is unimodal in tf, so a dozen inner solves suffice.',
      },
      {
        id: 'c_m43_scvx_loop',
        front: 'The SCvx iteration',
        back: 'Linearise the dynamics and non-convex constraints about the reference; solve the convex subproblem with a trust region and penalised virtual control; compute rho = actual/predicted reduction; accept or reject and resize; repeat until the virtual control and the step are both negligible.',
      },
      {
        id: 'c_m43_virtual_control',
        front: 'Virtual control vs trust region',
        back: 'Virtual control: an unconstrained, heavily penalised slack in the linearised dynamics that prevents artificial INFEASIBILITY. Trust region: a bound on deviation from the reference that prevents artificial UNBOUNDEDNESS. Different failures, different fixes.',
      },
      {
        id: 'c_m43_time_dilation',
        front: 'Free final time by time dilation',
        back: 'Normalise time to tau in [0, 1] and introduce the dilation factor s = tf as a decision variable, so dx/dtau = s f(x, u). The nonlinearity in s is then absorbed by the same successive linearisation as everything else.',
        formula: true,
      },
      {
        id: 'c_m43_stc',
        front: 'State-triggered constraint',
        back: 'Continuous encoding of "if trigger(x) < 0 then enforce c(x) <= 0", written so no integer variable is needed. Keeps conditional logic inside a continuous optimization. Example: enforce an angle-of-attack limit only while dynamic pressure exceeds a threshold.',
      },
      {
        id: 'c_m43_falcon_phases',
        front: 'The phases a Falcon-class booster return is broken into',
        back: 'Boostback (optional, for return-to-launch-site), entry burn to cut the peak heating and dynamic pressure, an unpowered aerodynamic phase steered by grid fins, then the landing burn under optimization-based guidance. Different phases, different guidance problems.',
      },
    ],
    tags: ['spacex-core', 'interview'],
    importance: 1.5,
  },

  /* ══════════════════════════════════════════════════════════════════════════
     TIER 6 — FLIGHT SOFTWARE, SIMULATION & V&V
     ══════════════════════════════════════════════════════════════════════════ */

  {
    id: 't6_m44_realtime_embedded',
    track: 'gnc',
    tier: 6,
    title: 'Real-Time & Embedded Systems',
    summary:
      'Write a control task that meets a hard deadline every single cycle and be able to prove it, not hope it. You will do schedulability analysis by hand, measure worst-case execution time rather than average, tune PREEMPT_RT Linux with core isolation and locked memory, and explain exactly why malloc, recursion and unbounded loops are banned from flight code.',
    prereqs: ['t0_m12_cpp'],
    hours: 75,
    topics: [
      'Hard vs soft vs firm real-time, and why "fast" and "real-time" are unrelated properties',
      'Determinism, worst-case execution time, and jitter as the three things you actually measure',
      'Fixed-priority scheduling: rate-monotonic priority assignment and the Liu-Layland utilisation bound',
      'Earliest-deadline-first and why it achieves higher utilisation but degrades worse on overload',
      'Exact schedulability by response-time analysis, and why the utilisation bound is only sufficient',
      'Priority inversion, priority inheritance and priority ceiling; the Mars Pathfinder failure and its fix',
      'RTOS primitives: tasks, semaphores, mutexes, message queues, and which of them can block unboundedly',
      'Real-time Linux: PREEMPT_RT, SCHED_FIFO and SCHED_DEADLINE, CPU isolation, IRQ affinity, mlockall',
      'Why a flight programme can fly Linux at all, and what it has to switch off to do so',
      'Interrupt handling, interrupt latency, and the split between the handler and the deferred half',
      'No dynamic allocation after initialisation: static pools, fixed-capacity containers, and placement construction',
      'Bounded loops, no recursion, and the rest of the Power of Ten rules',
      'Memory protection with an MMU or MPU; stack sizing and stack-overflow detection',
      'Cache and branch-predictor effects on determinism; why the fastest code is not always the most predictable',
      'Device drivers, memory-mapped I/O, and the volatile keyword',
      'Buses: UART, SPI, I2C, CAN, RS-422, Ethernet/UDP, and time-triggered protocols',
      'Time synchronisation: GPS pulse-per-second, PTP, and disciplined timestamping of every sample',
      'Bare-metal microcontrollers vs embedded Linux, and where the boundary sits on a real vehicle',
      'Cross-compilation, toolchains, bootloaders and firmware update',
      'Logging and telemetry under a real-time budget: lock-free ring buffers and never blocking the control task',
      'Fixed-point arithmetic and when it is still the right answer',
    ],
    objectives: [
      'Assign rate-monotonic priorities to a task set and prove schedulability by response-time analysis when the utilisation bound fails',
      'Build a control loop on PREEMPT_RT Linux that holds a hard period with bounded jitter, and measure the jitter honestly',
      'Measure and report worst-case execution time, and explain why the mean is the wrong statistic',
      'Reproduce a priority inversion and fix it with priority inheritance',
      'Justify, rule by rule, why flight code forbids dynamic allocation, recursion and unbounded loops',
    ],
    resources: [
      {
        title: 'Real-Time Systems: Design Principles for Distributed Embedded Applications',
        author: 'Hermann Kopetz',
        kind: 'book',
        free: false,
        note: 'The conceptual foundation: time-triggered architectures, global time, composability.',
      },
      {
        title: 'Real-Time Systems',
        author: 'Jane W. S. Liu',
        kind: 'book',
        free: false,
        note: 'The scheduling theory reference. Rate-monotonic, EDF, response-time analysis, resource protocols.',
      },
      {
        title: 'The Power of Ten — Rules for Developing Safety-Critical Code',
        author: 'Gerard J. Holzmann, JPL',
        kind: 'paper',
        url: 'https://spinroot.com/gerard/pdf/P10.pdf',
        free: true,
        note: 'Four pages. Read them, then read your own code against them.',
      },
      {
        title: 'NASA Software Engineering Handbook',
        kind: 'docs',
        url: 'https://swehb.nasa.gov/',
        free: true,
        note: 'The coding-standards and software-assurance sections are the public statement of what flight code has to satisfy.',
      },
      {
        title: 'Linux Foundation real-time Linux (PREEMPT_RT) documentation',
        kind: 'docs',
        url: 'https://wiki.linuxfoundation.org/realtime/start',
        free: true,
      },
      {
        title: 'FreeRTOS documentation and tutorials',
        kind: 'docs',
        url: 'https://www.freertos.org/',
        free: true,
        note: 'The cheapest way to get hands-on with tasks, priorities, queues and a tick.',
      },
      {
        title: 'What Really Happened on Mars? — the Pathfinder priority inversion',
        author: 'Glenn Reeves (JPL) and Mike Jones',
        kind: 'site',
        free: true,
        note: 'The canonical real-time post-mortem, and the best answer to "why does priority inheritance exist".',
      },
      {
        title: 'MISRA C++ Guidelines',
        kind: 'docs',
        free: false,
        note: 'Restricted-subset rules for safety-critical C++. Worth knowing even where it is not mandated.',
      },
    ],
    exercises: [
      {
        id: 'ex_m44_schedulability',
        title: 'Rate-monotonic analysis, by bound and exactly',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Before you write a line of a real-time loop, you should be able to say on paper whether the task set can meet its deadlines.

1. Implement **rm_utilization_bound**: the Liu-Layland sufficient bound U <= n (2^(1/n) - 1), which falls to ln 2 = 0.693 as n grows.
2. Implement **is_rm_schedulable_ll** using that bound. Note carefully that it is **sufficient but not necessary** — failing it proves nothing.
3. Implement **response_time**, the exact fixed-point iteration

   R = C_i + sum over all higher-priority tasks j of ceil(R / T_j) * C_j

   starting from R = C_i and iterating until it stops changing, with rate-monotonic priorities (shortest period highest). The task is schedulable when R <= its deadline, taken equal to its period.
4. Implement **is_schedulable_rta** and find a task set that fails the utilisation bound but passes exact analysis. Explain in one sentence where the bound throws away information.
5. Implement **wcet_margin** and use it on real measurements from the next exercise.

Success: all tests pass, and you can state from memory what the utilisation bound converges to and why it is conservative.`,
        starter: `import math


def rm_utilization_bound(n):
    """Liu and Layland sufficient bound for n tasks: n * (2**(1/n) - 1)."""
    raise NotImplementedError


def is_rm_schedulable_ll(tasks):
    """Sufficient utilisation test. tasks is a list of (C, T) in the same units."""
    raise NotImplementedError


def response_time(tasks, i):
    """Exact worst-case response time of tasks[i] under rate-monotonic priorities.

    tasks : list of (C, T); shorter period means higher priority.
    Returns the converged R, or None if the iteration exceeds the deadline T_i.
    """
    raise NotImplementedError


def is_schedulable_rta(tasks):
    """True when every task's worst-case response time is within its period."""
    raise NotImplementedError


def wcet_margin(samples, period):
    """Return (worst, utilisation) where worst is the largest execution-time
    sample and utilisation is worst / period. The mean is never the answer."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the utilisation bound has the right values and limit',
            assert: `import math
assert abs(rm_utilization_bound(1) - 1.0) < 1e-12, "one task can use the whole CPU"
assert abs(rm_utilization_bound(2) - 0.82842712) < 1e-6, "two tasks: 2*(sqrt(2)-1)"
assert abs(rm_utilization_bound(3) - 0.77976315) < 1e-6, "three tasks"
assert abs(rm_utilization_bound(1000) - math.log(2.0)) < 1e-3, "the bound tends to ln 2"`,
          },
          {
            name: 'a set that fails the bound but is genuinely schedulable',
            assert: `tasks = [(1.0, 4.0), (2.0, 6.0), (3.0, 12.0)]
u = sum(c / t for c, t in tasks)
assert u > rm_utilization_bound(3), "this set is meant to exceed the bound"
assert is_rm_schedulable_ll(tasks) is False, "the sufficient test must decline it"
assert is_schedulable_rta(tasks) is True, "but exact response-time analysis passes it"
assert abs(response_time(tasks, 2) - 10.0) < 1e-9, "the low-priority task finishes at t = 10"`,
          },
          {
            name: 'a genuinely unschedulable set is rejected',
            assert: `tasks = [(3.0, 5.0), (3.0, 8.0)]
assert is_schedulable_rta(tasks) is False, "the second task responds at t = 9 against a deadline of 8"
assert response_time(tasks, 0) == 3.0 or abs(response_time(tasks, 0) - 3.0) < 1e-9, "the top-priority task never waits"`,
          },
          {
            name: 'worst case, not mean',
            assert: `samples = [0.0021, 0.0019, 0.0020, 0.0118, 0.0022]
worst, util = wcet_margin(samples, 0.01)
assert abs(worst - 0.0118) < 1e-12, "report the maximum, not the average"
assert util > 1.0, "this task cannot meet a 100 Hz deadline and the mean would have hidden it"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m44_rt_loop',
        title: 'A 200 Hz loop that actually holds 200 Hz',
        kind: 'build',
        hours: 16,
        prompt: `Build a periodic control task on PREEMPT_RT Linux and characterise it properly.

1. Write it in C or C++: SCHED_FIFO at a sensible priority, clock_nanosleep with TIMER_ABSTIME against CLOCK_MONOTONIC so period error does not accumulate, mlockall to prevent page faults, and all buffers allocated before the loop starts.
2. Log the wake-up timestamp every cycle into a preallocated ring buffer and write it out after the run. Never call printf, never call malloc, never take a lock the logger also takes, inside the loop.
3. Run for one hour under load — compile a kernel in the background — and histogram the period error. Report the maximum, the 99.9th percentile and the standard deviation, in that order of importance.
4. Now improve it: isolate a core with isolcpus, pin the task with the CPU affinity mask, move interrupt affinity off that core, disable the deep C-states. Re-run and show the improvement in the tail, not the mean.
5. Repeat the whole exercise with a plain SCHED_OTHER thread and put both histograms on one axis.

Success: a tail bounded well below your period on the tuned configuration, a written list of every change you made and what each bought, and an honest statement of what you could not bound.`,
      },
      {
        id: 'ex_m44_priority_inversion',
        title: 'Break it like Pathfinder, then fix it',
        kind: 'build',
        hours: 8,
        prompt: `Reproduce the classic unbounded priority inversion and then remove it.

1. Three threads: high priority (periodic, short), medium priority (long, CPU-bound, takes no locks), low priority (periodic, takes a mutex the high-priority thread also needs).
2. Arrange the interleaving so the low-priority thread holds the mutex, the high-priority thread blocks on it, and the medium-priority thread preempts the low-priority one — so the highest-priority thread waits on the lowest, for as long as the medium thread wants to run. Instrument the high-priority thread's blocking time and show it is unbounded in the length of the medium thread's work.
3. Add a watchdog that resets the process when the high-priority thread misses its deadline, and watch it reset in a loop. That is what Pathfinder did on Mars.
4. Fix it by setting PTHREAD_PRIO_INHERIT on the mutex. Re-measure the blocking time and show it is now bounded by the length of the low-priority critical section.
5. Write the same argument for priority ceiling and say when you would prefer it.

Success: two measured blocking-time distributions, before and after, and a paragraph explaining what the watchdog did and did not catch.`,
      },
    ],
    quiz: [
      {
        id: 'q_m44_malloc',
        q: 'Why is malloc forbidden after initialisation in flight software?',
        choices: [
          'Because it is slow',
          'Because its execution time is not bounded, it can fail at any point in the mission once the heap fragments, and both failure modes appear only under specific allocation histories that testing is unlikely to reproduce',
          'Because the heap is stored in volatile memory that is lost on reset',
          'Because C++ exceptions cannot be used in flight code',
        ],
        answer: 1,
        explain:
          'Two independent problems, and both are about determinism rather than speed. First, an allocator walks free lists, so its worst-case execution time depends on the history of every allocation ever made; you cannot put a number on it, and a real-time analysis needs a number. Second, fragmentation means a request can fail after hours of perfectly normal operation, in a state you never reached in test, and the code path that handles that failure is the least-tested path in the system. The standard answer is to allocate everything during initialisation, use fixed-capacity containers and static pools thereafter, and let the initialisation phase be the only place a shortage can appear — where it is a ground-testable, fail-to-launch condition rather than an in-flight one.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'q_m44_wcet',
        q: 'Why is average execution time the wrong metric for a control task?',
        choices: [
          'Because averages are hard to measure accurately',
          'Because a hard real-time task must meet its deadline on every cycle, so the schedulability argument depends on the worst case; a task averaging 2 ms in a 10 ms frame that occasionally takes 12 ms is simply not schedulable, and the average says nothing about how often or how badly',
          'Because average execution time varies with CPU temperature',
          'Because the average includes the time spent blocked on I/O',
        ],
        answer: 1,
        explain:
          'Real-time correctness is a property of every instance, not of the distribution. Response-time analysis is built entirely on worst-case execution times, so a schedulability proof using averages proves nothing. This also drives how you write the code: bounded loops so the worst case is computable, no allocation so it is not history-dependent, avoidance of data-dependent algorithmic complexity, and awareness of cache behaviour, since a cold-cache instance can be several times slower than a warm one. In practice WCET is bounded by a combination of measurement over a long dispersed campaign and static analysis of the loop bounds, and the two must be reconciled.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'q_m44_pathfinder',
        q: 'What happened to Mars Pathfinder, and what fixed it?',
        choices: [
          'A memory leak exhausted the heap; the fix was to restart the task periodically',
          'A high-priority bus-management task blocked on a mutex held by a low-priority meteorological task, which was itself preempted by a medium-priority communications task, so the high-priority task missed its deadline and the watchdog reset the spacecraft; the fix was to enable priority inheritance on that mutex, uploaded in flight',
          'A cosmic-ray upset corrupted the instruction cache; the fix was memory scrubbing',
          'A floating-point exception in the attitude filter; the fix was a range check',
        ],
        answer: 1,
        explain:
          'This is unbounded priority inversion, and it is the standard reason priority inheritance exists. The high-priority task effectively inherits the priority of the lowest task in the chain, for as long as any medium-priority work wants to run. The flight fix was to set the priority-inheritance flag on the mutex in question, which VxWorks supported but which had been left off, and to upload the change. Two lessons usually drawn: the diagnosis was only possible because the team could reproduce the fault on an identical ground testbed with tracing enabled, and the watchdog correctly detected that something was wrong while being completely unable to identify or fix the cause.',
        b: 0.9,
        bloom: 'recall',
      },
      {
        id: 'q_m44_ll_bound',
        q: 'A three-task set has total utilisation 0.83, above the Liu-Layland bound of 0.78. What can you conclude?',
        choices: [
          'The task set is not schedulable under rate-monotonic priorities',
          'Nothing yet — the utilisation bound is sufficient but not necessary, so you must run exact response-time analysis, which frequently passes sets up to and beyond 0.9 utilisation',
          'The task set is schedulable under EDF but not under rate-monotonic',
          'The periods must be harmonic for the set to be schedulable',
        ],
        answer: 1,
        explain:
          'The bound is derived from the worst possible relationship between the periods, so it is pessimistic for any particular set. Exact analysis computes the worst-case response time of each task by the fixed-point iteration R = C_i + sum of ceil(R/T_j) C_j over higher-priority tasks, and compares it to the deadline. Harmonic period sets are the extreme case: with periods that divide one another, rate-monotonic is schedulable right up to 100% utilisation. EDF does have a simple necessary and sufficient test at utilisation not exceeding one, but it is a separate question, and EDF degrades far worse than fixed priority when the system is overloaded — which is a serious argument against it in flight.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_m44_overrun',
        q: 'Your 100 Hz loop usually takes 2 ms but occasionally takes 12 ms. Which mitigation preserves the most functionality?',
        choices: [
          'Lower the loop rate to 50 Hz, which halves the control bandwidth',
          'Find and remove the source of the tail — page faults, allocation, a lock held by a lower-priority thread, a data-dependent loop, or a cache-cold path — because a bounded worst case is worth more than any scheduling workaround',
          'Raise the thread priority above every other thread, including the interrupt threads',
          'Run the loop on two cores and take whichever finishes first',
        ],
        answer: 1,
        explain:
          'The first move on any tail is always diagnosis, because a 6x outlier is nearly always one identifiable mechanism: a page fault because memory was not locked, an allocation in what you thought was a hot path, blocking on a lock, a code path that only executes on some cycles, or cache pressure from another thread on the same core. Every other option trades away real capability. Lowering the rate costs bandwidth and phase margin. Raising the priority above the interrupt threads can starve the drivers you depend on. Redundant execution on two cores doubles the resource cost and does nothing about a deterministic cause. Only when the tail is understood and irreducible do you re-architect — splitting the work across frames or moving it to a lower-rate task.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'q_m44_preempt_rt',
        q: 'What does the PREEMPT_RT patch set actually change about Linux?',
        choices: [
          'It makes the kernel faster',
          'It makes almost all kernel code preemptible — converting spinlocks to sleeping mutexes with priority inheritance and moving interrupt handlers into schedulable kernel threads — which raises average overhead slightly but bounds the worst-case latency between an event and the real-time task running',
          'It replaces the scheduler with earliest-deadline-first',
          'It disables the memory management unit so page faults cannot occur',
        ],
        answer: 1,
        explain:
          'A stock kernel has long non-preemptible regions, so a high-priority user task can wait an unbounded time while the kernel finishes something. PREEMPT_RT attacks exactly that: kernel spinlocks become priority-inheriting sleeping locks, most interrupt handlers become threads you can prioritise, and the remaining non-preemptible sections are made short and audited. Throughput goes slightly down and latency determinism goes sharply up — which is the trade a control loop wants. It is why a modern launch vehicle can run its flight application on ordinary multi-core hardware under Linux instead of a classical RTOS, given core isolation, locked memory and an application written to real-time rules.',
        b: 1.2,
        bloom: 'understand',
      },
      {
        id: 'q_m44_recursion',
        q: 'Why do flight coding standards ban recursion?',
        choices: [
          'Because recursive functions are slower than iterative ones',
          'Because stack usage becomes data-dependent and cannot be statically bounded, so stack overflow — which typically corrupts adjacent memory silently rather than faulting cleanly — becomes a possibility no analysis can rule out',
          'Because compilers optimise recursion inconsistently',
          'Because recursion prevents the use of const correctness',
        ],
        answer: 1,
        explain:
          'Static analysis of maximum stack depth is a standard part of qualifying flight software, and it works by summing frame sizes along the call graph. Recursion makes the call graph cyclic and the depth a function of the input data, so there is no bound to compute. The failure mode is nasty: a stack overflow in an embedded system without memory protection overwrites whatever is next in memory, so the symptom appears far from the cause. The same reasoning bans unbounded loops — a loop must have a statically provable iteration limit so WCET is computable — and function pointers used in ways that make the call graph unresolvable.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'q_m44_timestamp',
        q: 'Why does a navigation filter care where in the pipeline a sensor sample is timestamped?',
        choices: [
          'It does not; the filter only needs the sample order',
          'Because the filter propagates the state to the measurement epoch, so an error in the timestamp acts like a velocity-dependent position error — at 2 km/s, a 1 ms timestamp error is a 2 m position error, and a systematic latency becomes a bias that no amount of filter tuning removes',
          'Because timestamps are used only for telemetry archiving',
          'Because the timestamp determines the measurement noise covariance',
        ],
        answer: 1,
        explain:
          'Timestamp discipline is one of the standard ways a real integration goes quietly wrong. The right timestamp is the instant the physical quantity was sampled, not the instant the packet arrived in your task. Everything between — bus transfer, driver buffering, task wake-up — is latency that must be measured and compensated, not ignored. A constant latency is the worst case in practice because it produces a clean bias that looks like a sensor error and gets tuned against. Flight systems discipline every board to a common time reference, with GPS pulse-per-second or PTP, and hardware-timestamp at the sensor wherever possible.',
        b: 1.3,
        bloom: 'apply',
      },
    ],
    cards: [
      {
        id: 'c_m44_hard_rt',
        front: 'Hard real-time',
        back: 'A missed deadline is a system failure, not a degradation. Correctness depends on WHEN the answer appears as much as on what it is. Fast is not the same as real-time: a deterministic 5 ms is worth more than an average 1 ms with a 20 ms tail.',
      },
      {
        id: 'c_m44_wcet',
        front: 'WCET',
        back: 'Worst-case execution time. The only statistic a schedulability proof can use. Bounded by measurement over dispersed cases plus static analysis of loop bounds; the mean and even the 99.9th percentile are irrelevant to the proof.',
      },
      {
        id: 'c_m44_jitter',
        front: 'Jitter',
        back: 'Variation in the actual period or start time of a periodic task. It matters to control because it appears as a varying sample time and an effective time delay, eating phase margin at crossover.',
      },
      {
        id: 'c_m44_ll_bound',
        front: 'Liu-Layland utilisation bound',
        back: 'U <= n (2^(1/n) - 1) is SUFFICIENT for rate-monotonic schedulability. n = 2 gives 0.828, n = 3 gives 0.780, and it decreases to ln 2 = 0.693. Failing it proves nothing — run exact analysis.',
        formula: true,
      },
      {
        id: 'c_m44_rta',
        front: 'Exact response-time analysis',
        back: 'R = C_i + sum over higher-priority j of ceil(R / T_j) * C_j, iterated from R = C_i to a fixed point. Schedulable when R <= D_i. Necessary and sufficient for fixed-priority scheduling.',
        formula: true,
      },
      {
        id: 'c_m44_rm',
        front: 'Rate-monotonic priority assignment',
        back: 'Shorter period gets higher priority. Optimal among fixed-priority assignments for independent periodic tasks with deadlines equal to periods. Deadline-monotonic generalises it when deadlines are shorter than periods.',
      },
      {
        id: 'c_m44_priority_inversion',
        front: 'Unbounded priority inversion',
        back: 'A high-priority task blocks on a resource held by a low-priority task, which is then preempted by an unrelated medium-priority task. The high task waits for the medium task, with no bound. Killed Mars Pathfinder in flight.',
      },
      {
        id: 'c_m44_priority_inheritance',
        front: 'Priority inheritance vs priority ceiling',
        back: 'Inheritance: a lock holder temporarily inherits the highest priority of anyone blocked on it, so blocking is bounded by the critical section length. Ceiling: the holder immediately takes the lock priority ceiling, which additionally prevents deadlock and chained blocking, at the cost of needing the ceilings declared.',
      },
      {
        id: 'c_m44_preempt_rt',
        front: 'What PREEMPT_RT changes',
        back: 'Kernel spinlocks become priority-inheriting sleeping mutexes, interrupt handlers become schedulable threads, and non-preemptible sections are shortened. Throughput down slightly, worst-case latency bounded. That is the trade a control loop wants.',
      },
      {
        id: 'c_m44_rt_checklist',
        front: 'Real-time Linux configuration checklist',
        back: 'SCHED_FIFO with a chosen priority; mlockall to prevent page faults; isolcpus plus CPU affinity to own a core; IRQ affinity moved off it; deep C-states disabled; clock_nanosleep with TIMER_ABSTIME so error does not accumulate; no allocation, no logging I/O, no unbounded locks inside the loop.',
      },
      {
        id: 'c_m44_no_malloc',
        front: 'Why no dynamic allocation after init',
        back: 'Unbounded and history-dependent execution time, plus the possibility of failing mid-mission once the heap fragments — in a code path that is by construction the least tested. Allocate at initialisation, then fixed-capacity containers and static pools.',
      },
      {
        id: 'c_m44_power_of_ten',
        front: 'The Power of Ten rules, in spirit',
        back: 'Simple control flow, no recursion; a statically provable bound on every loop; no allocation after initialisation; short functions; assertion density; smallest possible scope for data; check every return value; restricted preprocessor; restricted pointer use; compile with all warnings on, zero warnings, plus static analysers.',
      },
      {
        id: 'c_m44_volatile',
        front: 'What volatile does and does not do',
        back: 'It stops the compiler from caching or reordering accesses to that object, which is what a memory-mapped register needs. It is NOT a synchronisation primitive: it provides no atomicity and no memory ordering between threads. For that, use atomics.',
      },
      {
        id: 'c_m44_timestamping',
        front: 'Timestamp discipline',
        back: 'Timestamp at the instant the physical quantity was sampled, not at packet arrival. Measure and compensate the remaining latency. At 2 km/s, 1 ms of timestamp error is 2 m of position error, and a constant latency becomes a bias no tuning removes.',
      },
    ],
    tags: ['interview', 'software'],
    importance: 1.3,
  },

  {
    id: 't6_m45_fsw_architecture',
    track: 'gnc',
    tier: 6,
    title: 'Flight Software Architecture & Fault Tolerance',
    summary:
      'Design the software that has to keep flying when a piece of it stops working. You will build a mode manager with provably safe transitions and a guaranteed exit to safe from every state, implement a three-way voter and break it with injected faults, and write an FMEA for a sensor chain that says what the software does about each failure.',
    prereqs: ['t6_m44_realtime_embedded'],
    hours: 60,
    topics: [
      'Layering: hardware abstraction, device managers, the GNC application, the mode manager, telemetry and command',
      'Mode management as an explicit state machine, with guard conditions and an exit to safe from every state',
      'Command and telemetry: CCSDS packet structure, dictionaries, limit checking, and command authentication',
      'Redundancy architectures: cold, warm and hot standby; dual-dual; cross-strapping',
      'Triple modular redundancy and voting; mid-value select; what a voter can and cannot detect',
      'Byzantine faults and why a majority vote does not handle an asymmetric liar',
      'Commodity multi-core computers running Linux with redundant flight strings and voted output, as publicly described for modern launch and crew vehicles',
      'Radiation effects: single-event upsets, latch-up, total ionising dose; EDAC and ECC memory; memory scrubbing',
      'Watchdog timers: what they catch, what they miss, and why a reset is a real-time decision',
      'Fault detection, isolation and recovery: residual monitors, hypothesis tests, persistence counters and hysteresis',
      'FMEA and fault trees; identifying the single points of failure a voter does not cover',
      'Safing modes and the rule that safe must be reachable, stable and exitable only by an explicit decision',
      'Abort logic and autonomous flight termination systems',
      'Data integrity: CRCs, checksums, sequence counts and staleness checks on every input',
      'Determinism across redundant strings, and why a non-deterministic algorithm cannot be voted',
      'Time management, epochs, leap seconds and monotonic vs wall-clock time',
      'NASA core Flight System as a public reference architecture: apps, the software bus, tables',
      'Requirements traceability from a vehicle requirement to a line of code to a test',
      'Configuration management of gains, I-loads and tables separately from the executable',
      'In-flight software update: when it is the safer choice and when it is not',
    ],
    objectives: [
      'Design and implement a mode state machine with guard conditions, provable exits to safe, and a test suite that attempts every illegal transition',
      'Build a three-way voter with fault injection and state precisely what it can and cannot detect',
      'Write an FDIR routine that detects a degraded gyro from filter residuals without tripping on healthy noise',
      'Produce an FMEA for a GNC sensor chain that assigns each failure mode a detection means and a software response',
      'Explain why triple modular redundancy does nothing for a common-mode software defect, and what does',
    ],
    resources: [
      {
        title: 'NASA core Flight System (cFS)',
        kind: 'tool',
        url: 'https://github.com/nasa/cFS',
        free: true,
        note: 'A real, flight-proven, publicly readable architecture: software bus, apps, tables, executive services. Build it, run the sample mission, read the app lifecycle.',
      },
      {
        title: 'NASA Software Engineering Handbook',
        kind: 'docs',
        url: 'https://swehb.nasa.gov/',
        free: true,
        note: 'Requirements, traceability, software assurance and the classification scheme that decides how much rigour applies.',
      },
      {
        title: 'Engineering a Safer World: Systems Thinking Applied to Safety',
        author: 'Nancy G. Leveson',
        kind: 'book',
        free: true,
        note: 'Open-access from MIT Press. STAMP and STPA: hazard analysis for systems where the components all work and the system still fails.',
      },
      {
        title: 'NASA Study on Flight Software Complexity',
        author: 'Daniel Dvorak (ed.), NASA/JPL',
        kind: 'paper',
        free: true,
        note: 'Why flight software grows, what that costs, and the recommendations that followed.',
      },
      {
        title: 'NASA-STD-8739.8 — Software Assurance and Software Safety Standard',
        kind: 'docs',
        free: true,
      },
      {
        title: 'Mars Climate Orbiter and Ariane 5 Flight 501 mishap reports',
        kind: 'paper',
        free: true,
        note: 'Units and an unprotected type conversion in reused code. Both are architecture failures, not coding failures, and both are standard interview material.',
      },
    ],
    exercises: [
      {
        id: 'ex_m45_mode_manager',
        title: 'A mode manager you cannot talk into an illegal state',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `Implement the GNC mode manager for a reusable booster. The modes are **prelaunch, ascent, coast, entry, landing, safe**.

The rules:
- Transitions follow the flight sequence and may never skip a mode or run backwards.
- prelaunch to ascent requires ignition confirmed AND the umbilical disconnected.
- ascent to coast requires main engine cutoff.
- coast to entry requires altitude below 80 km AND navigation valid.
- entry to landing requires altitude below 5 km AND navigation valid.
- **Every mode may transition to safe, unconditionally and at any time.** This is the property that matters: there must be no state the vehicle can enter from which it cannot be commanded somewhere survivable.
- safe is terminal in flight: nothing exits it autonomously.
- A request to stay in the current mode is always accepted.

Implement **can_transition** and **step**. step returns the mode the manager ends in and a reason string that is empty on acceptance and explains the refusal otherwise — refusals must be observable in telemetry, never silent.

Then write the test suite the prompt does not give you: iterate over the full cross product of modes, request every target from every source under adversarial telemetry, and assert that nothing outside your table is ever accepted.

Success: all tests pass, the cross-product test finds no hole, and you can state why the unconditional exit to safe is designed in rather than bolted on.`,
        starter: `MODES = ("prelaunch", "ascent", "coast", "entry", "landing", "safe")


def can_transition(current, target, telemetry):
    """True when the transition is permitted by the mode table AND its guard.

    telemetry is a dict which may contain: ignition (bool),
    umbilical_disconnected (bool), meco (bool), altitude_m (float),
    nav_valid (bool). Missing keys must be treated as unsatisfied, never as
    True.
    """
    raise NotImplementedError


def step(current, request, telemetry):
    """Apply one mode request.

    Returns (new_mode, reason). On acceptance reason is the empty string and
    new_mode is the request. On refusal the manager stays in current and reason
    explains why, so the refusal appears in telemetry.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the nominal sequence is accepted and its guards are enforced',
            assert: `tm = {"ignition": True, "umbilical_disconnected": True}
assert can_transition("prelaunch", "ascent", tm) is True, "nominal liftoff must be allowed"
assert can_transition("prelaunch", "ascent", {"ignition": True}) is False, "umbilical guard missing"
assert can_transition("prelaunch", "ascent", {}) is False, "missing telemetry is never a pass"
assert can_transition("ascent", "coast", {"meco": True}) is True
assert can_transition("coast", "entry", {"altitude_m": 60000.0, "nav_valid": True}) is True
assert can_transition("coast", "entry", {"altitude_m": 60000.0, "nav_valid": False}) is False
assert can_transition("entry", "landing", {"altitude_m": 4000.0, "nav_valid": True}) is True
assert can_transition("entry", "landing", {"altitude_m": 40000.0, "nav_valid": True}) is False`,
          },
          {
            name: 'no mode may be skipped and no transition may run backwards',
            assert: `tm = {"ignition": True, "umbilical_disconnected": True, "meco": True,
      "altitude_m": 1000.0, "nav_valid": True}
assert can_transition("prelaunch", "landing", tm) is False, "modes may not be skipped"
assert can_transition("prelaunch", "entry", tm) is False
assert can_transition("coast", "ascent", tm) is False, "no going backwards"
assert can_transition("landing", "entry", tm) is False`,
          },
          {
            name: 'safe is reachable from everywhere and is terminal',
            assert: `for m in MODES:
    assert can_transition(m, "safe", {}) is True, "%s has no exit to safe" % m
for m in MODES:
    if m == "safe":
        continue
    assert can_transition("safe", m, {"ignition": True, "umbilical_disconnected": True,
                                      "meco": True, "altitude_m": 100.0,
                                      "nav_valid": True}) is False, "safe must be terminal"`,
          },
          {
            name: 'a refusal keeps the mode and explains itself',
            assert: `mode, reason = step("prelaunch", "landing", {})
assert mode == "prelaunch", "a refused request must not change mode"
assert isinstance(reason, str) and len(reason) > 0, "a refusal must be observable in telemetry"
mode, reason = step("ascent", "coast", {"meco": True})
assert mode == "coast" and reason == "", "an accepted request reports no reason"
mode, reason = step("coast", "coast", {})
assert mode == "coast" and reason == "", "staying put is always legal"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m45_redundancy',
        title: 'A voter and a residual monitor, both broken on purpose',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `Redundancy management is two separate jobs: deciding which value to use, and deciding which unit to stop trusting.

1. Implement **vote**, a mid-value select over three inputs with agreement checking. Output the median. Report as faulted the index of any channel that disagrees with **both** of the others by more than the tolerance. If no two channels agree, there is no majority: return no output and flag all three, because a voter with no majority must fail loudly rather than pick one.
2. Implement **nis**, the normalised innovation squared nu^T S^-1 nu. This is the standard filter-residual health metric: under the filter's own assumptions it is chi-squared distributed with as many degrees of freedom as the measurement, so its expected value is the measurement dimension.
3. Implement **persistence_trip**. A single sample above threshold is noise; a monitor must require N consecutive exceedances before it declares a fault, and reset its counter on any sample below. Tune N against the false-alarm rate you can accept.
4. Then run a campaign: inject stuck-at, slow-drift, and noisy-but-plausible gyro faults into your 6-DOF sim, and report detection latency and false-alarm rate for each. The slow drift is the one that will embarrass you.

Success: tests pass, and you have a table of detection latency against fault magnitude showing the size of fault your monitor cannot see.`,
        starter: `import numpy as np


def vote(values, tolerance):
    """Mid-value select over three channels with agreement checking.

    values : sequence of three floats
    Returns (output, faulted) where faulted is a sorted list of channel indices
    that disagree with both other channels by more than tolerance. With no
    majority at all, return (None, [0, 1, 2]).
    """
    raise NotImplementedError


def nis(residual, S):
    """Normalised innovation squared: residual^T inv(S) residual."""
    raise NotImplementedError


def persistence_trip(values, threshold, n_consecutive):
    """Index of the sample at which the monitor declares a fault, or None.

    A fault is declared at the index of the n_consecutive-th consecutive sample
    strictly above threshold. Any sample at or below threshold resets the count.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'three healthy channels vote cleanly',
            assert: `out, faulted = vote([1.000, 1.001, 1.002], 0.01)
assert abs(out - 1.001) < 1e-12, "mid-value select returns the median"
assert faulted == [], "no channel should be flagged"`,
          },
          {
            name: 'one hard-over channel is isolated and outvoted',
            assert: `out, faulted = vote([1.0, 1.0005, 5.0], 0.01)
assert faulted == [2], "the outlier must be identified, got %r" % (faulted,)
assert abs(out - 1.0005) < 1e-12, "the output must come from the agreeing pair"`,
          },
          {
            name: 'with no majority the voter fails loudly',
            assert: `out, faulted = vote([1.0, 5.0, 9.0], 0.01)
assert out is None, "a voter with no majority must not pick a value"
assert faulted == [0, 1, 2], "all three channels are suspect"`,
          },
          {
            name: 'NIS and the persistence counter',
            assert: `import numpy as np
assert abs(nis(np.zeros(2), np.eye(2))) < 1e-12, "a zero residual is perfectly consistent"
assert abs(nis(np.array([3.0, 4.0]), np.eye(2)) - 25.0) < 1e-9, "nu^T S^-1 nu"
assert abs(nis(np.array([2.0]), np.array([[4.0]])) - 1.0) < 1e-9, "scale by the covariance"
assert persistence_trip([0.1, 9.0, 0.2, 9.0, 9.0, 9.0], 1.0, 3) == 5, "trips on the third consecutive"
assert persistence_trip([9.0, 9.0, 0.0, 9.0, 9.0], 1.0, 3) is None, "the counter must reset"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m45_fmea',
        title: 'FMEA for a navigation sensor chain',
        kind: 'analysis',
        hours: 10,
        prompt: `Take the sensor chain of your capstone vehicle: IMU, GNSS receiver, radar altimeter, and the buses and power feeding them.

For every failure mode, fill one row: the failure, its local effect, its vehicle-level effect, how the software **detects** it, how the software **isolates** it, what the software **does** about it, and what the residual risk is if detection fails.

Include at least: total loss of a unit; a stuck-at output that is perfectly self-consistent; a slow bias drift within the valid range; a scale-factor error; a unit that reports valid data with a stale timestamp; a bus that delivers correct data late; and a power-rail brown-out that resets a unit mid-flight.

Then answer the hard ones:
1. Which of these does a three-way vote catch, and which does it not?
2. Which are undetectable without an independent measurement of the same physical quantity, and what is the cheapest independent measurement available?
3. For the stuck-at-plausible case, write the actual detection test and state its false-alarm rate against a healthy unit over a whole flight.

Success: a table with no row whose detection column says "operator notices", and a written statement of which single failures still take the vehicle out.`,
      },
      {
        id: 'ex_m45_cfs',
        title: 'Read a real flight architecture',
        kind: 'reading',
        hours: 8,
        prompt: `Clone NASA core Flight System, build it, and run the sample mission.

1. Trace one telemetry packet from an application calling the software bus all the way out, and one command all the way in. Draw the path.
2. Read the application lifecycle: registration, the main loop, the software bus subscription model, and what happens when an app fails to check in.
3. Read the table services design and write a paragraph on why gains and I-loads live in tables rather than in the executable, and what that buys operationally.
4. Compare the layering to the one you designed in the mode-manager exercise and list three things cFS does that yours does not, with the reason each exists.

Success: two traced paths, and a written comparison specific enough that somebody could act on it.`,
      },
    ],
    quiz: [
      {
        id: 'q_m45_tmr_common_mode',
        q: 'Why is triple modular redundancy with voting insufficient against a software defect?',
        choices: [
          'Because the voter itself is a single point of failure',
          'Because all three strings run the same code and receive the same inputs, so a logic defect produces the same wrong answer in all three and the vote is unanimous; redundancy addresses random hardware faults, not common-mode design faults',
          'Because three strings cannot outvote a Byzantine fault',
          'Because voting adds latency that violates the control deadline',
        ],
        answer: 1,
        explain:
          'Replication defends against independent failures. A software defect is perfectly correlated across replicas: give three copies of the same program the same input and they agree on the same wrong output, and the voter reports full health. What addresses it is diversity or verification — N-version programming with independently developed implementations, a simpler independent monitor that checks the complex function rather than repeating it, formal verification and exhaustive requirements-based testing, and operational protections such as an independent flight termination system. In practice, the industry has largely concluded that N-version programming is expensive and less effective than it sounds, and puts the money into verification and independent monitors instead. The voter being a single point is real but is handled by making it small enough to verify exhaustively.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_m45_watchdog',
        q: 'What does a watchdog timer fail to catch?',
        choices: [
          'A task that stops executing entirely',
          'Any fault in which the software keeps running and keeps petting the watchdog while computing wrong answers — a bad gain table, a sign error, a diverged filter, a stuck sensor accepted as valid',
          'A processor hardware fault',
          'An infinite loop in the main task',
        ],
        answer: 1,
        explain:
          'A watchdog answers exactly one question: is the software still reaching the point where it pets me, on schedule? That catches hangs, deadlocks, crashes and unbounded priority inversion. It says nothing about correctness. A vehicle flying a diverged navigation solution pets its watchdog happily all the way into the ground. That is why watchdogs are paired with content checks: reasonableness limits on outputs, residual monitors on the filter, cross-checks against an independent source, and heartbeat protocols that require a task to report progress rather than merely existence. It is also why the watchdog reset action itself must be designed — a reset during a landing burn may be far worse than continuing.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'q_m45_star_tracker',
        q: 'A star tracker begins reporting a valid-but-wrong attitude — self-consistent, correctly flagged healthy, and wrong by several degrees. What is the right software response?',
        choices: [
          'Trust the health flag; the unit says it is healthy',
          'Detect it by cross-checking against an independent source — propagated gyro attitude, a second tracker, a sun sensor — using a residual monitor with a persistence counter, then isolate the unit, stop incorporating it, continue on the remaining sources, and report it; a unit self-reporting health is never sufficient',
          'Reset the star tracker and re-accept its output immediately',
          'Widen the measurement covariance until the residual is acceptable',
        ],
        answer: 1,
        explain:
          'The whole point of this failure mode is that it defeats every check internal to the unit. Detection has to come from outside: the filter innovation against a gyro-propagated attitude is the natural monitor, because the two are physically independent. The monitor needs a persistence counter so that ordinary noise does not trip it, and hysteresis so the unit does not oscillate in and out of the solution. Once isolated, the vehicle continues on the remaining sources with a degraded but honest covariance, and the event goes to telemetry for the ground to adjudicate. Widening the covariance until the residual looks acceptable is the specific mistake this failure mode is designed to tempt you into: it makes the monitor quiet while letting the bad data corrupt the state.',
        b: 1.2,
        bloom: 'apply',
      },
      {
        id: 'q_m45_byzantine',
        q: 'What makes a Byzantine fault harder than the failures a simple majority vote handles?',
        choices: [
          'It occurs more frequently',
          'The faulty unit can send different values to different recipients, so the replicas disagree about what they received and a single round of voting cannot reach consensus; tolerating f Byzantine faults needs at least 3f+1 units and multiple rounds of exchange',
          'It always corrupts memory rather than outputs',
          'It only occurs in distributed systems that use Ethernet',
        ],
        answer: 1,
        explain:
          'A benign or fail-silent fault produces the same wrong value, or nothing, for everyone; two good units then trivially outvote it. A Byzantine fault is arbitrary and may be asymmetric — including a signal that sits exactly on a threshold so that two receivers sample it differently, which is a common physical cause. With asymmetric information, each replica has a different view of the world and they cannot agree by voting once. The classical results require 3f+1 nodes and f+1 rounds of exchange, plus a synchronised time base. Real avionics buses address this with interactive consistency exchanges, self-checking pairs, or hardware that makes asymmetry impossible.',
        b: 1.5,
        bloom: 'understand',
      },
      {
        id: 'q_m45_inflight_update',
        q: 'When is refusing to update software in flight the safer engineering choice?',
        choices: [
          'Always — flight software should never be changed after launch',
          'When the vehicle is in a dynamic, time-critical phase, when the new build has not been through the full verification campaign, or when the update mechanism itself can brick the computer; conversely, updating is safer when a known defect will certainly cause loss and the fix is small, testable on an identical ground rig, and applied in a quiescent phase',
          'Never — the ability to patch always dominates',
          'Only when the vehicle is uncrewed',
        ],
        answer: 1,
        explain:
          'This is a risk comparison, not a principle. Updating imports the risk of the new build, of the upload mechanism, and of an inconsistent state across redundant strings — and it invalidates the verification evidence the vehicle launched on. Not updating retains the known defect. Pathfinder is the canonical case for updating: the defect was certain to keep resetting the spacecraft, the fix was one flag, and it was reproduced and validated on an identical ground testbed first. The factors that decide it are how certain and how bad the existing defect is, how small and how well-verified the change is, whether there is a ground rig identical enough to prove it, whether the update can be rolled back, and whether there is a quiescent phase to do it in.',
        b: 1.4,
        bloom: 'analyze',
      },
      {
        id: 'q_m45_determinism',
        q: 'Why must the algorithms on redundant flight strings be deterministic?',
        choices: [
          'To reduce power consumption',
          'Because a voter compares outputs: if two healthy strings can legitimately produce slightly different answers from the same inputs, the voter cannot tell that divergence from a fault, so it either raises false alarms or must use a tolerance wide enough to mask real ones',
          'Because non-deterministic algorithms cannot be written in C++',
          'Because the real-time scheduler requires it',
        ],
        answer: 1,
        explain:
          'Voting only works if agreement is the expected outcome for healthy units. Anything that makes two healthy strings disagree — an iteration count that depends on timing, an unseeded random number, a reduction whose order depends on thread scheduling, a solver that stops on wall-clock time rather than an iteration count — turns healthy behaviour into apparent faults. This is one more argument for a convex guidance solver with a fixed iteration budget over an NLP that stops when it happens to converge. Where exact bit-for-bit agreement is impossible, the system must either synchronise the strings tightly at frame boundaries and compare at defined points, or designate one string as commanding and use the others as monitors with an explicitly justified tolerance.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m45_safing',
        q: 'What properties must a safing mode have?',
        choices: [
          'It must restore full mission capability automatically',
          'It must be reachable from every other mode unconditionally, stable once entered with no dependence on the subsystems that may have failed, and exitable only by an explicit, deliberate decision rather than autonomously',
          'It must use less power than any other mode',
          'It must be entered only by ground command',
        ],
        answer: 1,
        explain:
          'Reachable: there must be no corner of the state machine from which the vehicle cannot be commanded somewhere survivable, which is why the exit to safe is designed as an unconditional edge from every state rather than as a special case. Stable: safe mode must hold indefinitely using the minimum set of working equipment, so it cannot depend on the very subsystem whose failure caused entry. Exitable only deliberately: an autonomous exit risks cycling in and out of safe while the underlying fault persists, which is worse than staying safe. For a vehicle in a dynamic phase, note that safe may not mean passive — for a booster on a landing burn the survivable action is to keep flying the burn, so what safe means is phase-dependent and has to be designed per phase.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_m45_seu',
        q: 'How does a modern vehicle using commodity processors handle single-event upsets?',
        choices: [
          'By using only radiation-hardened parts, which are immune',
          'By accepting that upsets will occur and handling them at the system level: ECC on memory with background scrubbing, redundant computing strings with output voting so an upset string is outvoted, integrity checks on data and code, watchdogs, and fast restart of an affected string back into the running set',
          'By shielding the electronics box with enough aluminium to stop the particles',
          'By running the software slowly enough that upsets cannot accumulate',
        ],
        answer: 1,
        explain:
          'Radiation-hardened processors are enormously slower and more expensive, and hardening reduces rather than eliminates susceptibility. The modern alternative is to buy performance with commodity parts and pay for reliability architecturally: error-correcting memory with a scrubber that walks the memory correcting single-bit errors before they accumulate into uncorrectable double-bit ones, several independent computing strings whose outputs are voted so an upset string is simply outvoted, checksums on tables and code images, and a restart path that lets an affected string rejoin quickly. Shielding helps with total dose and lower-energy particles but cannot stop high-energy galactic cosmic rays, and mass is not free. Latch-up is the separate case that needs current-limited power switching to clear.',
        b: 1.2,
        bloom: 'understand',
      },
    ],
    cards: [
      {
        id: 'c_m45_layers',
        front: 'Standard flight software layering',
        back: 'Hardware abstraction, device managers, the GNC application, the mode manager, and command/telemetry services — with a message bus between them so applications do not call each other directly.',
      },
      {
        id: 'c_m45_mode_rule',
        front: 'The one non-negotiable property of a mode state machine',
        back: 'Every mode has an unconditional transition to safe. No reachable state may exist from which the vehicle cannot be commanded somewhere survivable. Everything else in the table is mission logic; this is a safety property.',
      },
      {
        id: 'c_m45_safing',
        front: 'Properties of a safing mode',
        back: 'Reachable from everywhere, stable once entered without depending on whatever failed, and exited only by an explicit decision — never autonomously. What "safe" means is phase-dependent: on a landing burn the survivable action may be to keep flying the burn.',
      },
      {
        id: 'c_m45_tmr',
        front: 'What TMR with voting does and does not cover',
        back: 'Covers independent random hardware faults — a single upset or failure is outvoted. Does NOT cover common-mode faults: the same software defect, the same bad table, the same wrong input, or a shared power or timing source.',
      },
      {
        id: 'c_m45_mvs',
        front: 'Mid-value select',
        back: 'Take the median of three channels. It is inherently immune to a single hard-over because the median cannot be the extreme value, and it degrades gracefully where an averaging voter would be dragged by the outlier.',
      },
      {
        id: 'c_m45_byzantine',
        front: 'Byzantine fault',
        back: 'A faulty unit sends DIFFERENT values to different recipients, so the good units disagree about what was sent. Tolerating f such faults needs at least 3f+1 units and multiple exchange rounds. A common physical cause is a signal sitting exactly on a sampling threshold.',
      },
      {
        id: 'c_m45_watchdog',
        front: 'What a watchdog catches and misses',
        back: 'Catches: hangs, deadlocks, crashes, unbounded priority inversion — anything that stops the code reaching the pet point. Misses: everything where the software runs happily and computes wrong answers.',
      },
      {
        id: 'c_m45_fdir',
        front: 'FDIR',
        back: 'Fault Detection, Isolation and Recovery. Detection: a monitor says something is wrong. Isolation: identify which unit. Recovery: reconfigure and continue. Detection without isolation is an alarm, not a fault management system.',
      },
      {
        id: 'c_m45_nis',
        front: 'Normalised innovation squared',
        back: 'NIS = nu^T S^-1 nu, with nu the filter innovation and S its covariance. Under the filter assumptions it is chi-squared with the measurement dimension as degrees of freedom, so its mean equals that dimension. The standard sensor and filter health monitor.',
        formula: true,
      },
      {
        id: 'c_m45_persistence',
        front: 'Why every fault monitor needs a persistence counter',
        back: 'Noise crosses any threshold occasionally. Requiring N consecutive exceedances trades detection latency against false-alarm rate; hysteresis on the clear side stops a unit oscillating in and out of the solution.',
      },
      {
        id: 'c_m45_seu',
        front: 'Radiation effects vocabulary',
        back: 'SEU: a bit flips, corrected by ECC and scrubbing. SEL: latch-up, a parasitic conducting path that needs the power cycled to clear and can destroy the part. TID: total ionising dose, cumulative degradation over the mission life.',
      },
      {
        id: 'c_m45_determinism_vote',
        front: 'Why a voted algorithm must be deterministic',
        back: 'The voter cannot distinguish legitimate disagreement from a fault. Anything timing-dependent — an unseeded RNG, a wall-clock iteration limit, a scheduling-dependent reduction order — turns healthy strings into apparent failures. An argument for a fixed iteration budget in the guidance solver.',
      },
      {
        id: 'c_m45_tables',
        front: 'Why gains and I-loads live in tables',
        back: 'They can be re-verified, re-approved and uploaded without rebuilding or re-qualifying the executable, and they carry their own version and checksum. It separates "what the vehicle does" from "how the vehicle is tuned", which are on different change cadences.',
      },
      {
        id: 'c_m45_staleness',
        front: 'What every input to flight software must carry',
        back: 'A timestamp, a validity flag, a sequence count and a checksum — and the consumer must check all four. Stale-but-valid data is one of the most common real integration failures, and it is invisible unless the age is checked on every use.',
      },
    ],
    tags: ['interview', 'software'],
    importance: 1.3,
  },

  {
    id: 't6_m46_6dof_simulation',
    track: 'gnc',
    tier: 6,
    title: '6-DOF Simulation Architecture',
    summary:
      'Build the simulation everything else in this curriculum is judged against: a modular, deterministic, closed-loop 6-DOF that runs your actual flight code at its true rate against modelled sensors, actuators and atmosphere. You will validate it against analytic cases and energy conservation, handle staging with proper event detection, and instrument it so a ten-thousand-case Monte Carlo is a configuration change rather than a rewrite.',
    prereqs: [
      't1_m17_attitude_kinematics',
      't1_m18_atmospheric_flight',
      't0_m10_numerical_methods',
      't0_m12_cpp',
    ],
    hours: 85,
    topics: [
      'The five-box decomposition: plant, sensors, GNC, actuators, environment — and why the interfaces between them are the whole design',
      'Fixed-step vs variable-step integration, and why a closed loop with a digital controller wants a fixed step',
      'Running the plant at a fine step while the flight software runs at its true rate, with zero-order hold between updates',
      'Frame and unit discipline: naming every vector by its frame, and the conventions that stop a sign error becoming a three-week debugging session',
      'Environment models: gravity field, atmosphere, wind and gust, magnetic field, ephemeris, solar radiation pressure',
      'Sensor models: noise, bias and bias instability, scale factor, misalignment, quantisation, latency, dropout, saturation, update rate',
      'Actuator models: thrust curves and start-up transients, TVC gimbal dynamics and rate limits, reaction wheel friction, thruster minimum impulse bit, valve delay',
      'Mass properties against time: propellant depletion, centre of mass migration, inertia tensor change',
      'Slosh and structural flex models, and where they get inserted in the loop',
      'Staging and other discontinuous events; zero-crossing detection and bisection to the event time',
      'The flight-software-in-the-loop boundary: compiling the actual flight code into the sim rather than a Python re-implementation of it',
      'The SIL, PIL and HIL progression and what each step actually adds',
      'Real-time hardware-in-the-loop: flight processors, motion tables, IMU stimulation, GNSS signal simulators, camera and altimeter stimulation',
      'Validation against analytic solutions, conservation laws, and eventually flight data',
      'Regression testing and golden-file comparison; what to do when a legitimate model improvement breaks every golden file',
      'Determinism and reproducibility: seeded random number streams, per-case seeds, and bit-exact replay of a single case out of a campaign',
      'Performance: vectorisation, parallelism over cases rather than within a case, and why Monte Carlo runs on a cluster',
      'Configuration management of the sim: models, parameters and scenarios versioned separately from the code',
    ],
    objectives: [
      'Build a modular, deterministic, closed-loop 6-DOF simulation that hosts your actual flight code at a fixed rate',
      'Validate it against a vacuum analytic case and an energy-conservation case, and state the residual error in each',
      'Implement event detection that lands exactly on a staging event instead of stepping over it',
      'Model sensors and actuators well enough that the controller sees latency, quantisation and rate limits, not perfect information',
      'Instrument the sim for Monte Carlo: per-case seeding, bit-exact replay, and a headless batch interface',
    ],
    resources: [
      {
        title: 'Modeling and Simulation of Aerospace Vehicle Dynamics',
        author: 'Peter H. Zipfel (AIAA)',
        kind: 'book',
        free: false,
        note: 'The definitive 6-DOF architecture book: frames, tensor notation, and the model hierarchy from 3-DOF to full 6-DOF.',
      },
      {
        title: 'Basilisk astrodynamics simulation framework',
        author: 'AVS Laboratory, University of Colorado',
        kind: 'tool',
        url: 'https://hanspeterschaub.info/basilisk/',
        free: true,
        note: 'Open-source C/C++ modules with Python scripting: dynamics, ADCS, guidance, Monte Carlo and HIL. The best architecture to read before designing your own.',
      },
      {
        title: 'NASA Trick Simulation Environment',
        kind: 'tool',
        url: 'https://github.com/nasa/trick',
        free: true,
        note: 'The simulation framework behind much of JSC. Read how it handles jobs, scheduling, checkpointing and data recording.',
      },
      {
        title: 'JSBSim flight dynamics model',
        kind: 'tool',
        url: 'https://github.com/JSBSim-Team/jsbsim',
        free: true,
        note: 'A mature open-source 6-DOF with atmosphere, aero tables and a scripting layer. Good for reading model structure.',
      },
      {
        title: 'RocketPy',
        kind: 'tool',
        url: 'https://github.com/RocketPy-Team/RocketPy',
        free: true,
        note: '6-DOF rocket trajectory simulation in Python, with built-in dispersion analysis. The fastest way to get a working baseline to compare against.',
      },
      {
        title: 'Analytical Mechanics of Space Systems',
        author: 'Schaub & Junkins (AIAA)',
        kind: 'book',
        free: false,
        note: 'The dynamics formulation Basilisk implements. Attitude representations, variable-mass systems, flexible bodies.',
      },
      {
        title: 'NASA-STD-7009 — Standard for Models and Simulations',
        kind: 'docs',
        free: true,
        note: 'What it takes to claim a simulation is credible: verification, validation, uncertainty characterisation, and the credibility assessment scale.',
      },
    ],
    exercises: [
      {
        id: 'ex_m46_integrator',
        title: 'Fixed-step integration, two rates, and landing exactly on an event',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `The three pieces of simulation machinery everything else sits on.

1. Implement **rk4_step**, classical fourth-order Runge-Kutta. Verify that its error falls as h^4 and that it integrates a cubic exactly.
2. Implement **simulate_two_rate**. The plant integrates at dt_plant; the controller runs at dt_ctrl and its output is **held constant between updates**. This is the single most important structural decision in a closed-loop sim: the flight code must see exactly the sample rate and the zero-order hold it will see in flight, or every margin you compute is a fiction. dt_ctrl must be an integer multiple of dt_plant, and you should assert that rather than silently resampling.
3. Implement **bisect_event**. Given a scalar event function that changes sign across a step, find the crossing time. Without this, staging happens at whatever time the integrator happened to step to, which puts a random quantisation of up to one step into every case in your Monte Carlo — and it will show up as a suspiciously fat tail in burnout velocity.

Success: all tests pass, and you can explain why stepping over an event is worse than a slightly inaccurate integrator.`,
        starter: `import numpy as np


def rk4_step(f, t, y, h):
    """One classical RK4 step of ydot = f(t, y). Returns y at t + h."""
    raise NotImplementedError


def simulate_two_rate(dynamics, control, y0, t_end, dt_plant, dt_ctrl):
    """Closed-loop simulation with the controller on a slower fixed rate.

    dynamics(t, y, u) -> dy/dt
    control(t, y)     -> u, evaluated only on controller ticks and HELD
                         constant until the next tick

    dt_ctrl must be an integer multiple of dt_plant.

    Returns (t_final, y_final, n_control_calls).
    """
    raise NotImplementedError


def bisect_event(g, t_lo, t_hi, tol=1e-12, max_iter=200):
    """Time in [t_lo, t_hi] at which the scalar event function g changes sign.

    Returns None when g(t_lo) and g(t_hi) have the same sign.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'RK4 integrates a cubic exactly and is fourth-order on an exponential',
            assert: `import numpy as np
y = rk4_step(lambda t, y: np.array([3.0 * t ** 2]), 0.0, np.array([0.0]), 0.5)
assert abs(y[0] - 0.125) < 1e-12, "RK4 must integrate a cubic exactly"
errs = []
for h in [0.4, 0.2, 0.1, 0.05]:
    yh = rk4_step(lambda t, y: -y, 0.0, np.array([1.0]), h)
    errs.append(abs(yh[0] - np.exp(-h)))
order = np.polyfit(np.log([0.4, 0.2, 0.1, 0.05]), np.log(errs), 1)[0]
assert abs(order - 5.0) < 0.3, "local RK4 error should fall as h^5, measured %.2f" % order`,
          },
          {
            name: 'the controller runs at its own rate and its output is held',
            assert: `import numpy as np
calls = []

def ctrl(t, y):
    calls.append(t)
    return np.array([1.0 if t < 0.5 else 0.0])

t_end, y_end, n = simulate_two_rate(lambda t, y, u: u, ctrl, np.array([0.0]),
                                    1.0, 0.001, 0.01)
assert n == 100, "expected 100 controller ticks in 1 s at 100 Hz, got %r" % n
assert abs(y_end[0] - 0.5) < 1e-9, "zero-order hold must integrate to exactly 0.5, got %r" % y_end[0]
assert len(calls) == 100 and abs(calls[1] - 0.01) < 1e-12, "ticks must be on the controller grid"`,
          },
          {
            name: 'a mismatched rate ratio is rejected rather than resampled',
            assert: `import numpy as np
try:
    simulate_two_rate(lambda t, y, u: u, lambda t, y: np.array([0.0]),
                      np.array([0.0]), 1.0, 0.003, 0.01)
except Exception:
    pass
else:
    raise AssertionError("a non-integer rate ratio must be rejected, not silently resampled")`,
          },
          {
            name: 'event detection lands on the crossing',
            assert: `t = bisect_event(lambda t: t - 0.37, 0.0, 1.0, tol=1e-12)
assert t is not None and abs(t - 0.37) < 1e-9, "expected the crossing at 0.37, got %r" % t
assert bisect_event(lambda t: t + 1.0, 0.0, 1.0) is None, "no sign change means no event"
t2 = bisect_event(lambda t: 100.0 - 9.80665 * t ** 2 / 2.0, 0.0, 10.0, tol=1e-12)
assert abs(t2 - (2.0 * 100.0 / 9.80665) ** 0.5) < 1e-8, "ground impact time is wrong"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m46_models',
        title: 'Sensor and actuator models that make the controller work for it',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `A controller that only ever sees truth is not being tested. Build the error models that stand between the plant and the flight code.

1. Implement **imu_error_model**. The measured specific force is

   a_meas = (I + diag(scale_factor) + misalignment) a_true + bias + noise,

   then quantised by rounding to the nearest multiple of the quantum. Keep noise as an additive argument so the model is deterministic and testable; the caller draws it from a seeded stream.
2. Implement **rate_limit**, the first-order actuator constraint everybody forgets until the TVC starts limit-cycling.
3. Implement **transport_delay**, a fixed-length buffer that returns the sample from n steps ago. Latency is the error source that most often turns a nominally stable design unstable, because it eats phase exactly at crossover.
4. Then sweep: with your booster controller, increase actuator latency in 5 ms steps and find the value at which the closed loop goes unstable. Compare it to the phase margin you designed for, converted to a delay margin at crossover. They should agree to within a few milliseconds, and if they do not, you have learned something about your model.

Success: tests pass, and you can predict the destabilising latency from the Bode plot before you run the sweep.`,
        starter: `import numpy as np


def imu_error_model(a_true, bias, scale_factor, misalignment, quantum, noise=None):
    """Deterministic IMU output model.

    a_true        : (3,) true specific force
    bias          : (3,)
    scale_factor  : (3,) fractional scale factor errors
    misalignment  : (3, 3) small off-diagonal misalignment matrix
    quantum       : quantisation step; use 0 for no quantisation
    noise         : (3,) additive noise sample, or None

    Returns the (3,) measured specific force.
    """
    raise NotImplementedError


def rate_limit(cmd, prev, max_rate, dt):
    """Limit the change from prev to cmd to max_rate * dt per step."""
    raise NotImplementedError


def transport_delay(buffer, sample, n_delay):
    """Fixed transport delay of n_delay steps.

    buffer is a list used as the delay line. Returns (output, buffer) where
    output is the sample from n_delay steps ago; before the line has filled,
    return the oldest value it holds.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'a perfect IMU passes truth through',
            assert: `import numpy as np
a = np.array([0.1, -0.2, 9.81])
out = imu_error_model(a, np.zeros(3), np.zeros(3), np.zeros((3, 3)), 0.0)
assert np.allclose(out, a, atol=1e-12), "a perfect IMU must be the identity"`,
          },
          {
            name: 'bias, scale factor and misalignment compose in the right order',
            assert: `import numpy as np
a = np.array([1.0, 0.0, 0.0])
sf = np.array([0.01, 0.0, 0.0])
M = np.zeros((3, 3))
M[1, 0] = 0.002
out = imu_error_model(a, np.array([0.0, 0.0, 0.05]), sf, M, 0.0)
assert abs(out[0] - 1.01) < 1e-12, "scale factor acts on the axis itself"
assert abs(out[1] - 0.002) < 1e-12, "misalignment couples x into y"
assert abs(out[2] - 0.05) < 1e-12, "bias adds after the sensitivity matrix"`,
          },
          {
            name: 'quantisation rounds to the nearest level',
            assert: `import numpy as np
out = imu_error_model(np.array([1.2345, 0.0, 0.0]), np.zeros(3), np.zeros(3),
                      np.zeros((3, 3)), 0.01)
assert abs(out[0] - 1.23) < 1e-9, "expected rounding to the nearest 0.01, got %r" % out[0]`,
          },
          {
            name: 'rate limiting and transport delay',
            assert: `import numpy as np
assert abs(rate_limit(10.0, 0.0, 5.0, 0.1) - 0.5) < 1e-12, "5 deg/s for 0.1 s is 0.5 deg"
assert abs(rate_limit(0.2, 0.0, 5.0, 0.1) - 0.2) < 1e-12, "a small command is not limited"
assert abs(rate_limit(-10.0, 0.0, 5.0, 0.1) + 0.5) < 1e-12, "limiting is symmetric"
buf = []
outs = []
for s in [1.0, 2.0, 3.0, 4.0, 5.0]:
    o, buf = transport_delay(buf, s, 2)
    outs.append(o)
assert abs(outs[4] - 3.0) < 1e-12, "a two-step delay must return the sample from two steps ago"
assert abs(outs[0] - 1.0) < 1e-12, "before the line fills, hold the oldest sample"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m46_booster_sim',
        title: 'The booster simulation',
        kind: 'build',
        hours: 40,
        prompt: `Build the 6-DOF you will use for the rest of the curriculum. Structure it as five separable modules — plant, environment, sensors, GNC, actuators — with explicit interfaces, because in the Monte Carlo module you will need to swap each of them independently.

Required:
1. **Plant**: rigid-body translational and rotational dynamics with a quaternion, variable mass, a time-varying inertia tensor and a migrating centre of mass.
2. **Environment**: an atmosphere model with density, pressure and speed of sound against altitude; a wind profile with a shear layer and a gust model; inverse-square gravity.
3. **Actuators**: TVC with second-order gimbal dynamics, deflection and rate limits, and an engine thrust model with start-up and shutdown transients.
4. **Sensors**: IMU with bias, scale factor, misalignment, quantisation and latency, at its own update rate; a radar altimeter with dropout.
5. **GNC**: your actual flight code, compiled or imported, called at a fixed 100 Hz through a zero-order hold.

Then validate, in this order:
- Vacuum, no attitude control, constant thrust: compare against the closed-form solution to at least six significant figures.
- Ballistic coast with no thrust and no drag: check total energy is conserved to your integrator's expected drift over the whole arc.
- Pure spin about a principal axis: angular momentum magnitude constant; quaternion norm within 1e-12 of one over the full run.
- Torque-free motion about the intermediate axis: reproduce the tennis-racket instability. If it does not appear, your inertia coupling is wrong.
- Add staging with event detection and show the state is continuous in position and velocity and discontinuous in mass exactly as intended.
- Insert a first bending mode and a slosh mode and show the change in the controller's stability margins.

Success: all six validation cases documented with their residuals, plus a headless batch entry point that takes a parameter dictionary and a seed and returns a result record.`,
      },
      {
        id: 'ex_m46_validation',
        title: 'Validating a simulation with no flight data',
        kind: 'analysis',
        hours: 8,
        prompt: `You have built a simulation of a vehicle that has never flown. Write the argument that it can be trusted, addressing each of the following, with evidence rather than assertion.

1. **Verification** — is the code solving the equations you wrote? Analytic cases, conservation laws, method-of-manufactured-solutions, step-size refinement studies, independent reimplementation of a critical module.
2. **Validation** — are they the right equations? Component-level test data (engine hot fire, TVC frequency response, sensor bench characterisation), wind tunnel and CFD comparison, structural modal survey, and analogous vehicles.
3. **Uncertainty** — what does the sim not know, and how is that ignorance represented as a dispersion rather than assumed away?
4. State explicitly the phenomena your model does not contain at all, and argue why each one is either negligible or covered by a margin.
5. Read NASA-STD-7009 and score your simulation against its credibility assessment scale. Be honest about the low scores.

Success: a written validation argument with a table of evidence per model, and an explicit list of known unknowns. The list of things you cannot validate is the most valuable part of this exercise.`,
      },
    ],
    quiz: [
      {
        id: 'q_m46_fixed_rate',
        q: 'Why must the GNC run at a fixed rate even when the plant is integrated adaptively, and how do you architect that?',
        choices: [
          'It need not; the controller can be evaluated at every integrator stage',
          'Because a digital controller is designed for a specific sample period and zero-order hold, and evaluating it at varying intervals changes its effective gains and phase; architect it by driving the integrator to each controller tick as a hard step boundary, holding the control constant across the step, and never letting the controller be called inside a stage evaluation',
          'Because adaptive integrators cannot handle discontinuous inputs',
          'Because fixed-rate execution reduces the number of function evaluations',
        ],
        answer: 1,
        explain:
          'A discrete controller has a sample period baked into its difference equation — every gain, every filter pole and the half-sample phase lag of the hold all assume it. Call it on the integrator schedule and it silently becomes a different controller, one you never designed or analysed. There is also a subtler trap: an adaptive integrator evaluates the derivative several times per step, including at rejected trial points, so a controller called from inside the derivative function would see time move backwards and any internal state it keeps would be corrupted. The architecture that works is to make each controller tick a hard step boundary, compute the control there once, hold it as a constant input across the step, and let the integrator do whatever it likes strictly inside.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_m46_determinism',
        q: 'Your simulation gives different answers on two runs with the same seed. What are the likely causes?',
        choices: [
          'Only an uninitialised variable',
          'An uninitialised variable or unzeroed buffer; a shared random stream consumed in an order that depends on thread scheduling; floating-point reduction order changing under parallelism or a different vectorisation path; and dependence on wall-clock time, system entropy, iteration counts that stop on time, or hash-map iteration order',
          'Only a difference in compiler version between the two runs',
          'Only the use of an adaptive integrator',
        ],
        answer: 1,
        explain:
          'Reproducibility is a property you design in, not one you get. The four classic causes are: state that is not initialised, so the run depends on whatever was in memory; a single random stream shared between modules, so a change anywhere shifts every downstream draw — the fix is one seeded stream per model, derived deterministically from the case seed; floating-point non-associativity, so a parallel reduction or a different SIMD path sums in a different order; and any dependence on time, entropy or container ordering. Without bit-exact replay you cannot debug a single failing case out of ten thousand, which is exactly when you need to, so this is worth the engineering.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_m46_hil',
        q: 'What does hardware-in-the-loop catch that software-in-the-loop cannot?',
        choices: [
          'Errors in the equations of motion',
          'Everything that depends on real hardware and real time: actual bus timing and latency, driver behaviour, interrupt interaction, processor loading and timing margin on the real computer, sensor electrical interfaces and their failure modes, power transients, and integration defects in wiring, endianness and scaling',
          'Errors in the aerodynamic database',
          'Numerical integration errors',
        ],
        answer: 1,
        explain:
          'SIL tests the algorithms; PIL adds the real processor and so the real timing and arithmetic; HIL adds the real hardware and so everything at the boundary. The defects HIL finds are overwhelmingly integration defects rather than algorithm defects: a message arriving one frame later than the design assumed, an interrupt storm under a condition nobody modelled, a scaling or endianness mismatch in a driver, a sensor whose failure mode is nothing like the model, a power transient on actuator commutation. None of these exist in a pure software model, because in a software model you wrote both sides of every interface. What HIL does not improve is the physics: a wrong aerodynamic database is just as wrong with real hardware attached.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'q_m46_event_detection',
        q: 'Why is stepping over a staging event worse than a slightly less accurate integrator?',
        choices: [
          'It is not; a small step size makes the error negligible',
          'Because the event time gets quantised to the integrator grid, which injects an error of up to one step into every case, appears as an artificial spread in burnout conditions across a Monte Carlo, and can corrupt the state through a discontinuity applied at the wrong instant; integrator truncation error is smooth and reducible, event quantisation is neither',
          'Because the integrator becomes unstable at discontinuities',
          'Because the mass would become negative',
        ],
        answer: 1,
        explain:
          'Two different kinds of error. Truncation error is a smooth function of step size that you can drive down and bound. Event quantisation is a discrete error that does not shrink proportionally, is different for every case in a dispersion campaign because the event lands at a different point in the step each time, and therefore shows up as scatter in your results that is a property of the simulation rather than the vehicle. It also breaks the integrator itself: a multi-stage method evaluating derivatives across a discontinuity computes a meaningless step, so the right handling is to detect the sign change, bisect to the event time, step exactly to it, apply the discontinuity, and restart the integrator cleanly on the far side.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'q_m46_validate_no_data',
        q: 'How do you validate a 6-DOF simulation of a vehicle that has never flown?',
        choices: [
          'You cannot; you must fly first',
          'Separate verification from validation, and build the validation case component by component: verify the code against analytic solutions and conservation laws, validate each model against its own test data — engine hot fire, TVC frequency response, wind tunnel and CFD, modal survey, sensor bench characterisation — validate the assembled sim against analogous vehicles, and represent everything still unknown as an explicit dispersion',
          'Compare against a second simulation written by the same team',
          'Tune the model parameters until the simulation matches the design requirements',
        ],
        answer: 1,
        explain:
          'The distinction is the whole answer: verification asks whether the code solves the equations correctly, and is settled by analytic cases, conservation checks, refinement studies and independent reimplementation. Validation asks whether they are the right equations, and before flight it can only be answered one model at a time, against data from the test of that component. The system-level claim is then an argument: each model is validated, the composition is verified, and what remains unvalidated is carried as a dispersion wide enough to cover the ignorance. NASA-STD-7009 formalises exactly this, including the requirement to state the simulation limitations. A second simulation from the same team shares the same misconceptions, and tuning parameters until the answer matches the requirement is how a simulation stops being evidence.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m46_frames',
        q: 'What convention most reliably prevents frame and sign errors in a large simulation?',
        choices: [
          'Using quaternions everywhere instead of Euler angles',
          'Encoding the frame in every variable name and every rotation object — so a vector is named for the frame it is expressed in and a rotation names both frames in order — and making the transformation chain a compile-time or assertion-checked property rather than a comment',
          'Working exclusively in the body frame',
          'Using SI units throughout',
        ],
        answer: 1,
        explain:
          'Frame errors are the most common defect in vehicle simulation, and they are nearly impossible to find by testing because the code runs and produces plausible numbers. The discipline that works is notational: every vector carries its frame in its name, every rotation names source and destination so that adjacent transformations must agree at the join, and a strongly typed implementation makes a mismatched composition a compile error. Quaternions avoid gimbal lock but are perfectly capable of expressing the wrong rotation, and the quaternion convention question — scalar first or last, and whether it rotates the frame or the vector — is itself a classic source of sign errors. SI units are necessary and insufficient: Mars Climate Orbiter was a unit error, and unit discipline would not have caught a single frame error.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'q_m46_golden_file',
        q: 'A legitimate improvement to the atmosphere model breaks every golden-file regression test. What is the right response?',
        choices: [
          'Revert the improvement; the regression suite is the authority',
          'Loosen the comparison tolerances until the tests pass',
          'Review the diffs to confirm every change is explained by the improvement and is in the expected direction and magnitude, record the model change and its justification, regenerate the goldens as a reviewed and versioned change, and keep the analytic and conservation tests — which should not have moved — as the real correctness gate',
          'Delete the golden files and rely on unit tests',
        ],
        answer: 2,
        explain:
          'Golden files detect change; they do not decide whether change is correct. That is why they need a companion set of tests that assert physics rather than history — analytic solutions, conservation laws, symmetry checks — which must not move when a model improves. When a golden diff appears, the work is to explain it: which cases moved, by how much, in which direction, and is that what the new model predicts? If yes, regenerate the baseline as a deliberate, reviewed, version-controlled action with the justification recorded, so that six months later somebody can find out why the numbers changed. Loosening tolerances until the suite goes quiet destroys its sensitivity permanently, and it is the most common way a regression suite dies.',
        b: 1.1,
        bloom: 'apply',
      },
      {
        id: 'q_m46_latency',
        q: 'Why does modelling sensor and actuator latency matter more than modelling their noise?',
        choices: [
          'It does not; noise dominates the error budget',
          'Because latency is a phase lag that eats stability margin directly at crossover and can destabilise a loop that looks perfectly healthy without it, whereas zero-mean noise mostly degrades performance rather than stability — and latency is systematic, so it does not average out over a campaign',
          'Because noise is impossible to model accurately',
          'Because latency changes the sensor scale factor',
        ],
        answer: 1,
        explain:
          'A pure delay has unit magnitude and phase of minus omega times the delay, so it subtracts phase without warning you in the magnitude plot, and it subtracts the most at high frequency where your crossover is. A loop with 40 degrees of phase margin at 10 rad/s has a delay margin of about 70 ms; add 80 ms of unmodelled sensor-to-actuator latency and it is unstable, with nothing in the noise budget hinting at it. Noise, by contrast, is zero-mean and mostly costs performance and actuator duty cycle. This is why a credible simulation accounts for the whole chain — sample instant, bus transfer, task wake-up, algorithm, command transport, actuator response — and why measuring the real end-to-end latency on a HIL rig is one of the highest-value tests in the programme.',
        b: 1.3,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m46_five_boxes',
        front: 'The five boxes of a closed-loop vehicle simulation',
        back: 'Plant, environment, sensors, GNC, actuators. Keep them separable with explicit interfaces so each can be swapped, dispersed or replaced by hardware independently.',
      },
      {
        id: 'c_m46_two_rate',
        front: 'The two-rate architecture',
        back: 'Integrate the plant on a fine step; run the flight code at its true rate with its output held constant between ticks. Each controller tick is a hard step boundary. Anything else silently changes the controller you designed.',
      },
      {
        id: 'c_m46_zoh_delay',
        front: 'Phase cost of the zero-order hold',
        back: 'A zero-order hold at period T behaves like a delay of about T/2, costing roughly 0.5 * omega_c * T radians of phase at crossover. A common design rule is to sample at 20 to 40 times the crossover frequency.',
        formula: true,
      },
      {
        id: 'c_m46_event_detection',
        front: 'Correct handling of a discrete event',
        back: 'Detect the sign change of an event function, bisect to the crossing time, step exactly to it, apply the discontinuity, then restart the integrator on the far side. Never integrate a multi-stage step across a discontinuity.',
      },
      {
        id: 'c_m46_validation_cases',
        front: 'The standard 6-DOF validation ladder',
        back: 'Vacuum analytic trajectory; energy conservation on a ballistic coast; angular momentum and quaternion norm under torque-free spin; the intermediate-axis (tennis racket) instability; then component test data; then flight data.',
      },
      {
        id: 'c_m46_verification_vs_validation',
        front: 'Verification vs validation, in one line each',
        back: 'Verification: am I solving the equations right? Validation: am I solving the right equations? The first is a code question answered by analytic cases; the second is a physics question answered by test data.',
      },
      {
        id: 'c_m46_sensor_errors',
        front: 'The IMU error model terms',
        back: 'Bias (and its instability), scale factor, misalignment and non-orthogonality, random walk noise, quantisation, latency, saturation, and finite update rate. Bias and latency hurt a navigation filter far more than white noise does.',
      },
      {
        id: 'c_m46_sensitivity_matrix',
        front: 'IMU measurement model',
        back: 'a_meas = (I + diag(sf) + M) a_true + b + n, then quantised. The sensitivity matrix acts on truth first; bias and noise add afterwards, which is why calibration must estimate them in that order.',
        formula: true,
      },
      {
        id: 'c_m46_actuator_models',
        front: 'Actuator model terms that change a design',
        back: 'Gimbal bandwidth and damping, deflection limit, RATE limit, backlash, transport delay, thrust start-up and shutdown transients, and minimum impulse bit on a thruster. Rate limit is the one that produces limit cycles nobody predicted.',
      },
      {
        id: 'c_m46_sil_pil_hil',
        front: 'SIL, PIL, HIL',
        back: 'SIL: flight code in the sim on a workstation — algorithm correctness. PIL: flight code on the real processor — timing, arithmetic, resource use. HIL: real hardware and real time — interfaces, latency, drivers, electrical failure modes.',
      },
      {
        id: 'c_m46_determinism',
        front: 'What determinism in a simulation requires',
        back: 'One seeded random stream per model derived from the case seed; no uninitialised state; no dependence on wall-clock time, entropy or container iteration order; and a fixed floating-point reduction order under parallelism. Without it you cannot replay the one case out of ten thousand that failed.',
      },
      {
        id: 'c_m46_frames',
        front: 'Frame discipline',
        back: 'Name every vector for the frame it is expressed in and every rotation for both frames in order, so adjacent transformations must agree at the join. Frame errors produce plausible numbers and survive testing; only notation and types catch them.',
      },
      {
        id: 'c_m46_parallelism',
        front: 'Where the parallelism goes in a Monte Carlo',
        back: 'Across cases, not within a case. Each case is an independent deterministic run of a single-threaded sim, which keeps bit-exact replay possible and scales linearly to as many cores as you can rent.',
      },
    ],
    tags: ['software'],
    importance: 1.2,
  },

  {
    id: 't6_m47_vv_montecarlo',
    track: 'gnc',
    tier: 6,
    title: 'Verification, Validation & Monte Carlo Analysis',
    summary:
      'Turn a working simulation into evidence. You will build a defensible dispersion set, run a Monte Carlo campaign large enough to make a reliability claim with a stated confidence, cross-check it against linear covariance analysis, verify stability margins across the whole flight envelope, and wire the whole thing into continuous integration so a margin violation fails the build.',
    prereqs: ['t6_m46_6dof_simulation', 't0_m09_probability_stats'],
    hours: 70,
    topics: [
      'Requirements, verification and validation; the verification matrix that maps every requirement to its evidence',
      'Verification by analysis, test, inspection and demonstration, and choosing correctly between them',
      'Building a dispersion set: mass properties, aerodynamic coefficients, propulsion performance, winds, sensor and actuator errors, initial conditions, atmosphere',
      'Distributions and their justification; correlations between dispersed parameters and why ignoring them is not conservative',
      'Number of runs against the confidence in the claim; the zero-failure formula and its assumptions',
      'Success criteria and scoring: defining what a failed case IS, before the campaign runs',
      'Extreme-value estimation and importance sampling when the failure probability is too small to sample directly',
      'Worst-case and corner-case analysis as a complement to, not a substitute for, Monte Carlo',
      'Linear covariance analysis as the fast complement: one run gives the covariance a thousand runs would estimate',
      'Where LinCov is valid and where nonlinearity, saturation and discrete logic force you back to Monte Carlo',
      'Three sigma versus the 99.73rd percentile, and why they differ for anything non-Gaussian',
      'Sensitivity analysis and driver identification: regression on the dispersion inputs, and scatter plots you actually look at',
      'Flight-envelope coverage and the difference between random coverage and designed coverage',
      'Stability margin verification across the envelope: frozen-time linearisation, gain, phase and delay margin against flight time',
      'Code verification: unit, integration and regression tests; statement, branch and MC-DC coverage',
      'Static analysis and formal methods: Coverity, Polyspace, model checking with SPIN',
      'Requirements-based testing, and why coverage without requirements-based tests proves very little',
      'Continuous integration for flight and simulation software: what runs on every commit, what runs nightly, what runs before a release',
      'Test-as-you-fly, and the risk taken every time you deviate from it',
      'Anomaly investigation, flight data reconstruction, and closing the loop by updating the models',
    ],
    objectives: [
      'Build a dispersion set where every distribution can be justified by test data, heritage or a stated engineering judgement',
      'Compute the number of runs needed to support a reliability claim at a stated confidence, and explain the assumption behind the formula',
      'Execute a Monte Carlo campaign, report CEP and a high percentile of landing error, and identify the top sensitivity drivers',
      'Implement linear covariance analysis for the same scenario and reconcile it against the Monte Carlo sample covariance',
      'Produce gain, phase and delay margin plots against flight time and show the requirement is met with margin everywhere',
      'Set up CI that runs a reduced Monte Carlo on every push and fails the build on a margin violation',
    ],
    resources: [
      {
        title: 'NASA-STD-7009 — Standard for Models and Simulations',
        kind: 'docs',
        free: true,
        note: 'The credibility assessment scale, and the requirement to state what your simulation cannot do.',
      },
      {
        title: 'Applying Monte Carlo Simulation to Launch Vehicle Design and Requirements Verification',
        author: 'John M. Hanson & Bernard B. Beard, NASA Marshall',
        kind: 'paper',
        url: 'https://ntrs.nasa.gov/citations/20100038453',
        free: true,
        note: 'How many runs, what to disperse, how to score, and the standard mistakes. The most directly useful paper in this module.',
      },
      {
        title: 'Linear Covariance Techniques for Orbital Rendezvous Analysis and Autonomous Onboard Mission Planning',
        author: 'David K. Geller, JGCD, 2006',
        kind: 'paper',
        free: false,
        note: 'The reference treatment of LinCov for navigation and guidance performance analysis.',
      },
      {
        title: 'DO-178C — Software Considerations in Airborne Systems and Equipment Certification',
        kind: 'docs',
        free: false,
        note: 'The aviation analogue. Worth knowing for the objectives structure and for MC-DC coverage, which is where the term comes from.',
      },
      {
        title: 'NASA Engineering and Safety Center (NESC) technical reports',
        kind: 'paper',
        url: 'https://ntrs.nasa.gov/',
        free: true,
        note: 'Searchable on NTRS. The Monte Carlo practice, GNC margin and flight software assessments are candid in a way textbooks are not.',
      },
      {
        title: 'Statistical Rethinking',
        author: 'Richard McElreath',
        kind: 'book',
        free: false,
        note: 'For the part of this module that is really about not fooling yourself with a sample.',
      },
      {
        title: 'GitHub Actions documentation',
        kind: 'docs',
        url: 'https://docs.github.com/en/actions',
        free: true,
        note: 'For the CI half of the module. Matrix builds map naturally onto a reduced dispersion campaign.',
      },
    ],
    exercises: [
      {
        id: 'ex_m47_statistics',
        title: 'The statistics a verification report actually needs',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Four small functions that carry most of the weight in a Monte Carlo verification report, and one distinction that gets people into trouble.

1. **runs_for_zero_failure(reliability, confidence)** — if a campaign of N runs produces zero failures, the largest reliability you can claim at a given confidence follows from (reliability)^N = 1 - confidence, so N = ln(1 - confidence) / ln(reliability). Round up. Check the number for 99.87% reliability at 95% confidence; it is larger than most people guess.
2. **gaussian_coverage(k)** — the probability mass within plus or minus k standard deviations of a Gaussian, erf(k / sqrt(2)).
3. **percentile_nearest_rank(samples, p)** — a percentile computed by nearest rank, with no interpolation. For a verification claim you want an actual observed sample, not an interpolated value between two.
4. **cep(x, y)** — circular error probable, the radius of the circle about the target containing half the landings. Report it alongside a high percentile, never instead of one.

Then the distinction: generate a heavy-tailed sample, and show that the mean plus three standard deviations and the 99.73rd percentile are far apart. **Three sigma and 99.73 percent are the same number only for a Gaussian**, and landing dispersions, driven through saturations and discrete logic, are not Gaussian.

Success: tests pass, and you can say out loud what claim 2303 runs with zero failures supports.`,
        starter: `import math


def runs_for_zero_failure(reliability, confidence):
    """Runs needed so that zero failures supports the reliability claim.

    N = ceil(ln(1 - confidence) / ln(reliability))
    """
    raise NotImplementedError


def gaussian_coverage(k):
    """Probability mass within +/- k sigma of a Gaussian: erf(k / sqrt(2))."""
    raise NotImplementedError


def percentile_nearest_rank(samples, p):
    """The p-th percentile by nearest rank: the ceil(p/100 * N)-th smallest
    value, with p in (0, 100]. Returns an actual observed sample."""
    raise NotImplementedError


def cep(x, y):
    """Circular error probable about the origin: the median miss radius."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the zero-failure run count',
            assert: `assert runs_for_zero_failure(0.9987, 0.95) == 2303, "99.87% at 95% confidence needs 2303 clean runs"
assert runs_for_zero_failure(0.99, 0.90) == 230, "99% at 90% confidence"
assert runs_for_zero_failure(0.999, 0.95) == 2995, "an extra nine costs an order of magnitude"`,
          },
          {
            name: 'Gaussian coverage at one, two and three sigma',
            assert: `assert abs(gaussian_coverage(1.0) - 0.6826895) < 1e-6
assert abs(gaussian_coverage(2.0) - 0.9544997) < 1e-6
assert abs(gaussian_coverage(3.0) - 0.9973002) < 1e-6, "this is where 99.73% comes from"`,
          },
          {
            name: 'nearest-rank percentile returns a real sample',
            assert: `vals = list(range(1, 101))
assert percentile_nearest_rank(vals, 99) == 99, "ceil(0.99*100) = 99th smallest"
assert percentile_nearest_rank(vals, 50) == 50
assert percentile_nearest_rank(vals, 100) == 100
assert percentile_nearest_rank([7.0], 50) == 7.0`,
          },
          {
            name: 'CEP is the median miss radius',
            assert: `x = [1.0, 0.0, -3.0, 0.0]
y = [0.0, 2.0, 0.0, -4.0]
assert abs(cep(x, y) - 2.5) < 1e-12, "radii 1,2,3,4 have a median of 2.5"
assert abs(cep([3.0], [4.0]) - 5.0) < 1e-12`,
          },
          {
            name: 'three sigma is not the 99.73rd percentile off-Gaussian',
            assert: `import random
random.seed(7)
s = [random.expovariate(1.0) for _ in range(200000)]
mean = sum(s) / len(s)
var = sum((v - mean) ** 2 for v in s) / (len(s) - 1)
three_sigma = mean + 3.0 * var ** 0.5
p9973 = percentile_nearest_rank(s, 99.73)
assert p9973 > three_sigma * 1.1, "for an exponential tail the true percentile far exceeds mean + 3 sigma"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m47_lincov',
        title: 'Linear covariance, and where it stops being true',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `Monte Carlo estimates a covariance with a thousand runs. Linear covariance analysis computes it with one, provided the system is linear enough. Build both and find the boundary.

1. Implement **propagate_covariance**, the discrete-time covariance recursion P <- Phi P Phi^T + Q.
2. Implement **sample_covariance**, the unbiased estimator from a Monte Carlo sample.
3. Verify they agree for a genuinely linear system — this is the sanity check that says your two pipelines share a convention and your dispersion set is what you think it is.
4. Then break it: put a saturation in the actuator and re-run both. Report where they diverge and by how much, and plot the sample distribution to show it is no longer Gaussian.
5. Write the rule you would put in a verification plan for when LinCov may be used in place of Monte Carlo.

Success: tests pass, and you have a concrete demonstration of a case where LinCov reports a covariance that understates the true tail.`,
        starter: `import numpy as np


def propagate_covariance(P, Phi, Q):
    """One step of the covariance recursion: Phi P Phi^T + Q."""
    raise NotImplementedError


def sample_covariance(samples):
    """Unbiased sample covariance of an (N, n) array of realisations."""
    raise NotImplementedError


def lincov_run(P0, Phis, Qs):
    """Propagate P0 through a sequence of steps and return the final covariance."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the covariance recursion',
            assert: `import numpy as np
P = np.diag([4.0, 1.0])
Phi = np.array([[1.0, 0.1], [0.0, 1.0]])
Q = np.diag([0.01, 0.02])
out = propagate_covariance(P, Phi, Q)
assert np.allclose(out, Phi @ P @ Phi.T + Q), "P <- Phi P Phi^T + Q"
assert np.allclose(out, out.T), "a covariance must stay symmetric"
assert np.all(np.linalg.eigvalsh(out) > 0.0), "and positive definite"`,
          },
          {
            name: 'sample covariance is unbiased and matches numpy',
            assert: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(500, 3)) @ np.array([[2.0, 0.0, 0.0], [0.3, 1.0, 0.0], [0.0, 0.5, 0.7]]).T
assert np.allclose(sample_covariance(X), np.cov(X, rowvar=False), atol=1e-10), "use the N-1 denominator"`,
          },
          {
            name: 'LinCov and Monte Carlo agree on a linear system',
            assert: `import numpy as np
rng = np.random.default_rng(42)
P0 = np.diag([9.0, 0.25])
Phi = np.array([[1.0, 0.5], [0.0, 0.98]])
Q = np.diag([0.04, 0.01])
n_steps = 20
Pf = lincov_run(P0, [Phi] * n_steps, [Q] * n_steps)
L0 = np.linalg.cholesky(P0)
Lq = np.linalg.cholesky(Q)
X = (L0 @ rng.normal(size=(2, 40000))).T
for _ in range(n_steps):
    X = X @ Phi.T + (Lq @ rng.normal(size=(2, X.shape[0]))).T
Pmc = sample_covariance(X)
assert np.allclose(Pf, Pmc, rtol=0.05, atol=1e-6), "linear propagation must match the sample covariance"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m47_campaign',
        title: 'Ten thousand cases, and what you are allowed to conclude',
        kind: 'build',
        hours: 24,
        prompt: `Run a real dispersion campaign on your 6-DOF landing simulation.

1. **Build the dispersion set.** Every dispersed parameter gets a distribution, a source and a one-line justification: mass properties, centre of mass, inertia, aerodynamic coefficients, thrust and Isp, engine start-up timing, winds (as correlated profiles, not independent samples per altitude), IMU errors, altimeter errors, initial state, and atmospheric density. Where you have no data, say so and disperse wider.
2. **Define failure before you run.** Touchdown velocity, tilt, lateral miss, propellant remaining, structural load, minimum stability margin. A case is a failure if any criterion is violated. Write this down first — deciding afterwards is how campaigns lie.
3. **Run 10,000 cases**, with per-case seeds recorded so any case can be replayed bit-exactly.
4. **Report**: CEP, the 99.87th percentile miss, touchdown velocity and tilt distributions, propellant margin, the failure count and the reliability claim it supports at 95% confidence.
5. **Find the drivers.** Regress each output on the dispersed inputs, rank by standardised coefficient, and plot the top three as scatter. Name the three parameters that dominate and say what you would do about each: tighten the hardware, change the design, or carry the margin.
6. **Investigate every failure individually.** Replay it, find the mechanism, and classify it as a real vehicle limitation, a controller deficiency, or a simulation artefact. "Three out of ten thousand, so it meets the requirement" is not an engineering conclusion.

Success: a written verification report with the numbers above, a driver table, and a one-page write-up of each failed case with its mechanism.`,
      },
      {
        id: 'ex_m47_ci',
        title: 'Continuous integration that can fail the build on a margin',
        kind: 'build',
        hours: 12,
        prompt: `Make the verification run itself.

1. On every push: build the flight code with all warnings as errors, run the unit tests, run a static analyser, and run a **reduced** Monte Carlo of 200 fixed-seed cases. Fail the build if any case fails a success criterion, or if the minimum gain or phase margin across the envelope drops below the requirement.
2. Nightly: the full 10,000-case campaign on a parallel matrix, publishing the report as an artefact and trending the key statistics over time. A slow drift in the 99th-percentile miss over two weeks of commits is exactly what you want to see coming.
3. Add a performance gate: fail if the flight-code worst-case execution time regresses beyond a threshold.
4. Report code coverage and make an uncovered branch in flight code a build failure. Then find a branch that is covered but not tested against any requirement, and explain why coverage alone is a weak criterion.
5. Make the whole thing reproducible: pin every dependency, record the sim version and the dispersion-set version in every result record.

Success: a CI configuration that genuinely fails on an injected regression — prove it by injecting a sign error into the controller and showing the pipeline goes red with a message that identifies the failing criterion.`,
      },
    ],
    quiz: [
      {
        id: 'q_m47_run_count',
        q: 'How many Monte Carlo runs are needed to support a 99.87% success rate at 95% confidence, assuming zero failures?',
        choices: [
          'About 750',
          'About 2300 — from N = ln(1 - 0.95) / ln(0.9987)',
          'Exactly 10,000, which is why that number is conventional',
          'It cannot be determined without knowing the distribution of the outputs',
        ],
        answer: 1,
        explain:
          'Treat each case as an independent Bernoulli trial. If the true success probability were exactly R, the chance of seeing N successes in a row is R^N; setting that equal to 1 minus the confidence and solving gives N = ln(0.05)/ln(0.9987) = 2303. Two things to note in an interview. First, this is the zero-failure formula; a single failure raises the required N sharply, and the general case needs a binomial or Clopper-Pearson bound. Second, it assumes the cases are independent and that the dispersion set genuinely covers the failure mechanisms — if the thing that kills the vehicle is not dispersed, no number of runs finds it. That assumption, not the arithmetic, is where these campaigns actually go wrong.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'q_m47_lincov_validity',
        q: 'When is linear covariance analysis valid, and when must you use Monte Carlo?',
        choices: [
          'LinCov is always valid and Monte Carlo is only used for presentation',
          'LinCov is valid when deviations stay small enough that the dynamics, sensors and control are well approximated by their linearisation about the reference and the driving uncertainties are Gaussian; Monte Carlo is required for saturation, deadbands, discrete logic and mode switching, non-Gaussian dispersions, and any question about the tail',
          'LinCov is valid only for linear systems with no control',
          'Monte Carlo is required whenever the state dimension exceeds ten',
        ],
        answer: 1,
        explain:
          'LinCov propagates a covariance through the linearised closed-loop system and gives, in one run, what thousands of Monte Carlo cases estimate noisily. That makes it superb for navigation design trades, sensor sizing and early sensitivity work — you can sweep a parameter in seconds. Its assumptions are real, though: linearity about the reference and Gaussian inputs. Every nonlinearity a real vehicle has — actuator saturation, thrust limits, a deadband, a mode switch, an FDIR trip — breaks them, and it breaks them exactly in the tail, where the answer matters. The professional pattern is to use both: LinCov for design iteration and for sanity-checking the Monte Carlo covariance, Monte Carlo for the verification claim.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m47_mcdc',
        q: 'What is MC-DC coverage and why do safety-critical standards require it?',
        choices: [
          'Coverage of every line of code at least once',
          'Modified condition/decision coverage: every condition in a compound decision must be shown to independently affect the outcome, which catches conditions that are dead or masked by others without needing the exponential number of tests full condition coverage would require',
          'Coverage of every possible combination of every input value',
          'A measure of how much of the requirements set has been tested',
        ],
        answer: 1,
        explain:
          'Statement coverage can be satisfied while a compound condition is never exercised in a way that shows it matters; decision coverage only requires the whole expression to be both true and false. MC-DC additionally requires, for each condition, a pair of test cases that differ only in that condition and produce different outcomes — proving the condition is live and correctly polarised. It costs roughly N+1 tests for N conditions rather than 2^N, which is why it is the level DO-178C mandates for the highest criticality. The essential caveat: coverage is a measure of test adequacy, not of correctness. You get MC-DC by writing requirements-based tests and then measuring coverage to find what the requirements missed; writing tests to chase a coverage number produces tests that assert whatever the code already does.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m47_three_failures',
        q: 'Your Monte Carlo shows 3 failures in 5000 cases, clustered in one corner of the envelope. What do you do next?',
        choices: [
          'Report 99.94% success and move on, since the requirement is 99.9%',
          'Replay each failure bit-exactly, find the physical mechanism, determine whether it is a vehicle limitation, a controller deficiency or a simulation artefact, then run a focused campaign in that corner at much higher density to find the true boundary and the sensitivity that drives it',
          'Increase the run count until the failure fraction drops below the requirement',
          'Remove the corner of the envelope from the dispersion set',
        ],
        answer: 1,
        explain:
          'A cluster is a mechanism, not noise, and three cases in a corner is the campaign telling you where the cliff is. The order of work is: replay each case exactly, which requires the per-case seeding you built in; trace the mechanism through the time histories; classify it. If it is a simulation artefact, fix the sim and rerun, because you now know your other results are suspect too. If it is real, characterise the boundary with a dense focused campaign or a direct worst-case search in that corner, since random sampling is a terrible way to map a cliff edge. Then decide: change the design, tighten a hardware requirement, restrict the operating envelope, or accept with a documented rationale. Quoting the aggregate rate ignores the fact that the failures are not randomly distributed, and reducing the dispersion set to make the failures disappear is how programmes lose vehicles.',
        b: 1.2,
        bloom: 'apply',
      },
      {
        id: 'q_m47_three_sigma',
        q: 'Why do "three sigma" and "the 99.73rd percentile" differ in practice?',
        choices: [
          'They do not differ; the terms are interchangeable',
          'They coincide only for a Gaussian; a landing dispersion pushed through saturations, deadbands and mode logic is skewed and heavy-tailed, so mean plus three standard deviations can badly understate the true 99.73rd percentile — which is why verification should quote an observed percentile from the sample, not a computed sigma multiple',
          'Because the sample standard deviation is a biased estimator',
          'Because three sigma refers to the input dispersions and the percentile to the outputs',
        ],
        answer: 1,
        explain:
          'The equivalence is a property of the normal distribution and nothing else. Closed-loop vehicle outputs are the result of nonlinear dynamics, saturating actuators, discrete mode changes and occasionally a fault response, and they are routinely skewed with a heavy tail on the side that matters. Reporting mean plus three sigma then produces a number that sounds rigorous and understates the risk. Report the empirical percentile from the sample instead, note that estimating the 99.73rd percentile needs enough samples in the tail to be meaningful, and if the tail matters more than the sample can resolve, use extreme-value methods or importance sampling rather than a sigma multiple.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_m47_correlation',
        q: 'Why is dispersing correlated parameters independently not conservative?',
        choices: [
          'It is always conservative, since independent sampling produces a wider spread',
          'Because it can be either conservative or optimistic depending on the system: independent sampling destroys the combinations that actually occur, so it can miss a worst case that only arises when two parameters move together — a wind profile is the standard example, where independent sampling per altitude produces physically impossible shear and simultaneously never produces the coherent shear layer that drives loads',
          'Because independent sampling always reduces the variance of the output',
          'Because correlated parameters cannot be sampled numerically',
        ],
        answer: 1,
        explain:
          'The intuition that "independent means wider means safer" is wrong, and the wind case shows why. Sample each altitude bin independently and you get a profile that oscillates violently with altitude — physically impossible, and so filtered out by the vehicle, producing loads that are too low. The real atmosphere has coherent shear layers that persist over kilometres, and it is precisely that coherence that drives the q-alpha load. The correct approach is to sample from measured profile databases or from a model that reproduces the real spatial correlation structure. The same applies to mass properties, which move together with the propellant load, and to aerodynamic coefficients, which share a common wind-tunnel uncertainty. Correlation is part of the physics, and dropping it is a modelling error, not a conservatism.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m47_margins',
        q: 'How are stability margins verified across a flight envelope that changes continuously?',
        choices: [
          'By checking the margins at the nominal design point',
          'By frozen-time linearisation: linearise the plant at closely spaced flight times and dispersed conditions, compute gain, phase and delay margins for each, and plot the minimum against flight time against the requirement — plus a nonlinear check, since frozen-time analysis assumes the parameters vary slowly compared with the loop dynamics',
          'By running a single nonlinear simulation and observing that it does not diverge',
          'By computing the eigenvalues of the closed-loop system once per flight phase',
        ],
        answer: 1,
        explain:
          'A launch vehicle changes mass, inertia, dynamic pressure, aerodynamic stability and actuator effectiveness continuously, so margin is a function of time, not a number. The standard practice is to freeze the plant at a dense grid of flight times, close the loop with the controller and its gain schedule as flown, and compute gain, phase and delay margin at each point, repeated over the dispersed cases so the plot shows the worst case rather than the nominal. Delay margin deserves its own line because latency is the error source that most often destroys a design late. Frozen-time analysis is an approximation — it assumes the plant varies slowly relative to the loop — so it is paired with nonlinear time-domain verification, and structural and slosh modes must be included, since the margin that kills vehicles is usually at a flex mode rather than at the rigid-body crossover.',
        b: 1.6,
        bloom: 'analyze',
      },
      {
        id: 'q_m47_hpc',
        q: 'Why does a serious GNC verification effort need large-scale compute?',
        choices: [
          'Because 6-DOF simulations cannot be run on a single machine',
          'Because the unit of work is a campaign, not a run: thousands of cases per configuration, many configurations per design iteration, re-run on every meaningful commit — and the value is in the iteration rate, since a campaign that takes a week means a design decision per week',
          'Because the optimisation solver requires a GPU cluster',
          'Because flight data must be reprocessed continuously',
        ],
        answer: 1,
        explain:
          'One case is cheap; the campaign is not. Ten thousand cases times several vehicle configurations times every design iteration times every phase of flight, plus focused campaigns around each corner you find, plus the reduced set that runs on every commit — that is the workload, and it is embarrassingly parallel across cases, which is why it scales linearly with cores. The real argument is cycle time. A verification campaign that takes overnight means you test a design change per day; one that takes a week means you stop testing changes. Making the campaign fast is therefore a design-velocity decision rather than an infrastructure detail, and it is why organisations that iterate hardware quickly also invest heavily in simulation throughput.',
        b: 0.8,
        bloom: 'understand',
      },
    ],
    cards: [
      {
        id: 'c_m47_v_and_v',
        front: 'Verification vs validation (V&V)',
        back: 'Verification: did we build the thing right — does it meet its requirements? Validation: did we build the right thing — do the requirements produce a vehicle that works? Verification is against the specification; validation is against reality.',
      },
      {
        id: 'c_m47_run_count',
        front: 'Zero-failure Monte Carlo run count',
        back: 'N = ln(1 - confidence) / ln(reliability). For 99.87% at 95% confidence, N = 2303. Assumes independent cases AND a dispersion set that actually contains the failure mechanism.',
        formula: true,
      },
      {
        id: 'c_m47_three_sigma',
        front: 'Three sigma vs the 99.73rd percentile',
        back: 'Equal only for a Gaussian. Closed-loop outputs pushed through saturations and mode logic are skewed and heavy-tailed, so quote the observed percentile from the sample, not mean plus three standard deviations.',
      },
      {
        id: 'c_m47_cep',
        front: 'Define circular error probable, and state its main weakness as a landing-accuracy metric.',
        back: 'Circular error probable: the radius of the circle about the target containing 50% of landings. A median, so it says nothing about the tail — always report it with a high percentile beside it.',
      },
      {
        id: 'c_m47_dispersion_set',
        front: 'What goes in a launch-vehicle dispersion set',
        back: 'Mass properties and centre of mass, inertia, aerodynamic coefficients, thrust and Isp and their transients, engine timing, winds as correlated profiles, atmospheric density, sensor and actuator errors, and initial conditions. Every one with a distribution and a stated source.',
      },
      {
        id: 'c_m47_correlation',
        front: 'Why correlations must be dispersed, not dropped',
        back: 'Independent sampling destroys the combinations that physically occur. Sampling wind independently per altitude gives impossible shear AND never produces the coherent shear layer that drives q-alpha loads — optimistic, not conservative.',
      },
      {
        id: 'c_m47_success_criteria',
        front: 'The rule about success criteria',
        back: 'Define what counts as a failed case BEFORE the campaign runs. Touchdown velocity, tilt, miss distance, propellant remaining, loads, minimum margin. Deciding afterwards is how a campaign is made to say what you wanted.',
      },
      {
        id: 'c_m47_lincov',
        front: 'Linear covariance analysis',
        back: 'Propagate P <- Phi P Phi^T + Q through the linearised closed loop: one run gives the covariance Monte Carlo estimates with thousands. Valid while deviations stay linear and inputs stay Gaussian; breaks at saturations, deadbands and mode logic — that is, in the tail.',
        formula: true,
      },
      {
        id: 'c_m47_frozen_time',
        front: 'Frozen-time margin verification',
        back: 'Linearise at closely spaced flight times over dispersed cases, compute gain, phase and DELAY margin at each, and plot the worst case against flight time. Include flex and slosh modes — the binding margin is usually there, not at rigid-body crossover.',
      },
      {
        id: 'c_m47_mcdc',
        front: 'MC-DC coverage',
        back: 'Modified condition/decision coverage: each condition in a compound decision must be shown to independently change the outcome. Costs about N+1 tests for N conditions instead of 2^N. Required at the highest DO-178C level.',
      },
      {
        id: 'c_m47_coverage_caveat',
        front: 'The coverage caveat',
        back: 'Coverage measures test adequacy, never correctness. Write requirements-based tests first, then measure coverage to find what the requirements missed. Tests written to chase a coverage number assert whatever the code already does.',
      },
      {
        id: 'c_m47_test_as_you_fly',
        front: 'Test-as-you-fly',
        back: 'Test in the configuration, sequence and environment you will fly. Every deviation — a stubbed interface, a scaled model, a skipped mode transition, ground support equipment left connected — is a piece of untested flight, and it must be listed and justified.',
      },
      {
        id: 'c_m47_reconstruction',
        front: 'Flight data reconstruction',
        back: 'After flight, estimate what the vehicle actually did and what the environment actually was, then feed the difference from prediction back into the models and the dispersions. A campaign that is never reconciled with flight data is a simulation of a simulation.',
      },
      {
        id: 'c_m47_ci',
        front: 'What CI runs for a GNC stack',
        back: 'Per push: build with warnings as errors, unit tests, static analysis, a reduced fixed-seed Monte Carlo, margin and WCET gates. Nightly: the full campaign with trended statistics. Per release: the whole thing plus coverage and the verification report.',
      },
    ],
    tags: ['software', 'math'],
    importance: 1.2,
  },

  /* ══════════════════════════════════════════════════════════════════════════
     TIER 7 — INTEGRATION & CAREER
     ══════════════════════════════════════════════════════════════════════════ */

  {
    id: 't7_m48_capstone',
    track: 'gnc',
    tier: 7,
    title: 'Integrated GNC Capstone: Ascent to Landing',
    summary:
      'Build the whole thing and prove it works: a reusable-booster GNC stack flying ascent, coast, entry and propulsive landing in closed loop, with a multiplicative extended Kalman filter on IMU, GNSS and radar altimeter, convex powered-descent guidance recomputed in flight, a TVC controller with bending and slosh filters, a mode manager and FDIR, a C++ flight-code core, and a ten-thousand-case Monte Carlo running in CI behind a written V&V report.',
    prereqs: [
      't5_m41_ascent_guidance',
      't5_m43_convex_guidance',
      't6_m45_fsw_architecture',
      't6_m47_vv_montecarlo',
      't4_m35_nonlinear_filters',
      't4_m36_inertial_navigation',
      't3_m31_nonlinear_control',
      't2_m24_edl',
    ],
    hours: 150,
    topics: [
      'System decomposition and the interface contracts between navigation, guidance, control and the vehicle',
      'Error budgeting: allocating a landing-accuracy requirement across navigation, guidance and control',
      'Rate architecture: navigation at IMU rate, control at 100 Hz or faster, guidance re-solved at 1 to 2 Hz, mode management at a low rate',
      'A multiplicative extended Kalman filter on IMU, GNSS and radar altimeter, with error-state formulation and attitude error as a three-parameter local perturbation',
      'Convex powered-descent guidance in the loop: re-solve cadence, warm starting, deadline policy and the closed-form fallback',
      'TVC attitude control with bending-mode and slosh notch or roll-off filtering, and gain scheduling against dynamic pressure and mass',
      'Mode management across prelaunch, ascent, staging, coast, entry, landing and safe',
      'FDIR: residual monitors on the filter, sensor cross-checks, actuator health, and the response of each',
      'C++ flight core with a Python analysis and plotting layer over it, sharing exactly one implementation of the algorithms',
      'Ten thousand dispersed cases in CI, with per-case seeding and bit-exact replay',
      'The written V&V report: requirements, evidence, margin plots, failure analysis and known limitations',
    ],
    objectives: [
      'Integrate navigation, guidance, control, mode management and FDIR into one closed-loop stack that flies the full mission in 6-DOF',
      'Allocate and then verify an error budget from the landing-accuracy requirement down to each contributing subsystem',
      'Run convex guidance in the loop at a realistic cadence with a defined and tested deadline-miss policy',
      'Demonstrate stability margins that meet the requirement across the entire dispersed flight envelope, including flex and slosh',
      'Produce a verification report an engineer who has never seen the project could audit',
    ],
    resources: [
      {
        title: 'Eigen — C++ linear algebra',
        kind: 'tool',
        url: 'https://eigen.tuxfamily.org/',
        free: true,
        note: 'Header-only, fast, and the de facto standard in flight-adjacent C++. Learn its fixed-size types, which avoid allocation.',
      },
      {
        title: 'pybind11',
        kind: 'tool',
        url: 'https://github.com/pybind/pybind11',
        free: true,
        note: 'How you get one implementation of the algorithms rather than a C++ one and a Python one that quietly disagree.',
      },
      {
        title: 'ECOS — embedded conic solver',
        author: 'Domahidi, Chu & Boyd',
        kind: 'tool',
        url: 'https://github.com/embotech/ecos',
        free: true,
        note: 'Library-free ANSI C SOCP solver designed for embedded use. The natural target once your CVXPY prototype works.',
      },
      {
        title: 'GoogleTest',
        kind: 'tool',
        url: 'https://github.com/google/googletest',
        free: true,
        note: 'For the unit and integration tests that stand between your flight core and the Monte Carlo.',
      },
      {
        title: 'Basilisk astrodynamics simulation framework',
        kind: 'tool',
        url: 'https://hanspeterschaub.info/basilisk/',
        free: true,
        note: 'Read its module interfaces and Monte Carlo layer before finalising your own architecture.',
      },
      {
        title: 'Space Vehicle Dynamics and Control',
        author: 'Bong Wie (AIAA)',
        kind: 'book',
        free: false,
        note: 'The integrated reference for launch-vehicle attitude control, flex and slosh interaction, and TVC design.',
      },
    ],
    exercises: [
      {
        id: 'ex_m48_fallback',
        title: 'The guidance deadline policy, written as code',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Before the integration begins, settle the question everybody defers: what does the vehicle fly on the cycle where the convex solver does not return in time?

1. Implement **zem_zev_accel**, the closed-form zero-effort-miss / zero-effort-velocity law

   ZEM = r_f - (r + v t_go + 0.5 g t_go^2)
   ZEV = v_f - (v + g t_go)
   a_cmd = (6 / t_go^2) ZEM - (2 / t_go) ZEV

   This is the minimum-energy solution with a free thrust magnitude, it costs microseconds, and it is the natural fallback for a powered-descent stack. Guard the singularity: clamp t_go to a floor, because both terms blow up as t_go goes to zero and the last second of a landing is exactly when you cannot afford a divide-by-nearly-zero.
2. Implement **select_guidance**, the policy itself: fly the fresh convex solution when the solver returned; otherwise keep flying the previous solution while it is still young enough; otherwise fall back to the closed form. Each branch reports its source so the choice appears in telemetry.
3. Then wire it in and measure: force the solver to miss a deadline at the worst moment in your landing burn and report the cost in landing accuracy and propellant for each of the three branches.

Success: tests pass, and your V&V report contains a measured number for what a missed guidance cycle costs — not an assurance that it will not happen.`,
        starter: `import numpy as np


def zem_zev_accel(r, v, r_f, v_f, g, t_go, t_go_floor=0.5):
    """Zero-effort-miss / zero-effort-velocity acceleration command.

    r, v     : (3,) current position and velocity
    r_f, v_f : (3,) target position and velocity at intercept
    g        : (3,) gravitational acceleration
    t_go     : time to go, seconds; clamped below at t_go_floor

    Returns the (3,) commanded acceleration, excluding gravity.
    """
    raise NotImplementedError


def select_guidance(solver_ok, solver_accel, age_s, max_age_s, fallback_accel):
    """Deadline policy for the guidance cycle.

    Returns (accel, source) with source one of "convex", "held" or "fallback":
      solver_ok                      -> the fresh solution, "convex"
      not solver_ok and age <= max   -> the previous solution, "held"
      otherwise                      -> the closed-form law, "fallback"
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'a coasting intercept needs only the velocity term',
            assert: `import numpy as np
a = zem_zev_accel(np.array([0.0, 0.0, 100.0]), np.array([0.0, 0.0, -10.0]),
                  np.zeros(3), np.zeros(3), np.zeros(3), 10.0)
assert np.allclose(a, [0.0, 0.0, -2.0], atol=1e-12), "ZEM is zero here, so a = -(2/tgo) ZEV; got %r" % (a,)`,
          },
          {
            name: 'the law accounts for gravity over the remaining time',
            assert: `import numpy as np
g = np.array([0.0, 0.0, -9.80665])
a = zem_zev_accel(np.array([0.0, 0.0, 1000.0]), np.zeros(3),
                  np.zeros(3), np.zeros(3), g, 20.0)
zem = -(np.array([0.0, 0.0, 1000.0]) + 0.5 * g * 400.0)
zev = -(g * 20.0)
expect = (6.0 / 400.0) * zem - (2.0 / 20.0) * zev
assert np.allclose(a, expect, atol=1e-9), "expected %r, got %r" % (expect, a)
assert a[2] < 0.0, "the command must brake, not accelerate downward"`,
          },
          {
            name: 'the time-to-go singularity is guarded',
            assert: `import numpy as np
g = np.array([0.0, 0.0, -3.7114])
a0 = zem_zev_accel(np.array([0.0, 0.0, 5.0]), np.array([0.0, 0.0, -1.0]),
                   np.zeros(3), np.zeros(3), g, 0.0, t_go_floor=0.5)
af = zem_zev_accel(np.array([0.0, 0.0, 5.0]), np.array([0.0, 0.0, -1.0]),
                   np.zeros(3), np.zeros(3), g, 0.5, t_go_floor=0.5)
assert np.all(np.isfinite(a0)), "t_go = 0 must not produce infinities"
assert np.allclose(a0, af, atol=1e-12), "below the floor the command must equal the floor value"`,
          },
          {
            name: 'the deadline policy picks the right branch',
            assert: `import numpy as np
fresh = np.array([1.0, 0.0, 12.0])
held = np.array([0.9, 0.0, 11.5])
fb = np.array([0.0, 0.0, 9.0])
a, s = select_guidance(True, fresh, 0.0, 2.0, fb)
assert s == "convex" and np.allclose(a, fresh), "a fresh solve must be used"
a, s = select_guidance(False, held, 1.0, 2.0, fb)
assert s == "held" and np.allclose(a, held), "a young previous solution may be held"
a, s = select_guidance(False, held, 5.0, 2.0, fb)
assert s == "fallback" and np.allclose(a, fb), "a stale solution must be dropped for the closed form"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m48_error_budget',
        title: 'The error budget, before any code is written',
        kind: 'analysis',
        hours: 10,
        prompt: `Start the capstone the way a real programme starts it: with a requirement and an allocation, not with an algorithm.

Take a landing-accuracy requirement — say a 10 m radius at 99.87% — and allocate it.

1. Decompose the terminal error into navigation error at touchdown, guidance error (the difference between the commanded and the achievable trajectory given the re-solve cadence and the deadline policy), control error (tracking error under wind and actuator limits), and knowledge error in the landing site itself.
2. Allocate a budget to each, root-sum-square to the total, and leave explicit margin. State your assumption about independence and say where it is wrong.
3. Push each allocation down one more level. Navigation error at touchdown is driven by IMU bias and random walk over the time since the last GNSS fix, altimeter bias, lever-arm error and timestamp latency — assign a number to each and check they combine to your allocation.
4. Identify the single biggest contributor and say what you would spend money on to halve it.
5. At the end of the capstone, come back and compare the measured Monte Carlo breakdown against this allocation. Where you were wrong is the most interesting result in the project.

Success: a one-page budget tree with numbers at every leaf, a stated total with margin, and — after the campaign — a second column with what you actually measured.`,
      },
      {
        id: 'ex_m48_stack',
        title: 'Build the stack',
        kind: 'build',
        hours: 90,
        prompt: `Build the full GNC stack against the 6-DOF simulation from the simulation module. Work in this order, because each stage is only testable once the previous one holds.

1. **Navigation.** A multiplicative EKF in error-state form: IMU mechanisation at sensor rate, GNSS position and velocity updates, radar altimeter updates below its acquisition altitude. Attitude error as a three-parameter local perturbation with the reference quaternion reset every update. Verify against truth with the filter's own covariance: the normalised estimation error squared should sit inside its chi-squared bounds, and if it does not, the filter is lying about its confidence.
2. **Control.** TVC attitude control with gain schedules against dynamic pressure and mass, a notch or roll-off for the first bending mode, and slosh handled by bandwidth separation. Verify margins across the envelope before anything else is connected.
3. **Guidance.** Ascent: your PEG-style closed-loop steering from the ascent module. Descent: the convex solver, re-solved at 1 to 2 Hz with warm starting, plus the deadline policy from the first exercise.
4. **Mode management and FDIR.** The state machine, with the unconditional exit to safe, and the residual monitors driving isolation and reconfiguration.
5. **Integration.** C++ core compiled into the sim; Python layer for analysis and plotting, bound to exactly the same implementation. The Python side must never contain a second copy of an algorithm.
6. **Campaign.** 10,000 dispersed cases in CI, a reduced set on every push, per-case seeds recorded.

Hold yourself to these gates: every subsystem verified in isolation before integration; every integration step adding exactly one subsystem; a written note for each gate saying what you measured.

Success: the full mission flown in closed loop from liftoff to touchdown across the dispersion set, meeting the success criteria you wrote down in the V&V module, with margins plotted against flight time.`,
      },
      {
        id: 'ex_m48_report',
        title: 'The V&V report',
        kind: 'analysis',
        hours: 24,
        prompt: `Write the document that makes the capstone count — for the project and for the interview loop, where this is the artefact you will be asked about.

Required sections:
1. **System description**: architecture, rates, interfaces, one diagram that fits on a page.
2. **Requirements and verification matrix**: every requirement, its verification method, and a pointer to the evidence.
3. **Navigation performance**: error against truth, filter consistency, and the effect of each sensor dropping out.
4. **Guidance performance**: solve time distribution, iteration counts, deadline misses and what they cost, optimality compared against an offline high-fidelity solution.
5. **Control performance**: gain, phase and delay margins against flight time over the dispersed set, plus flex and slosh interaction.
6. **Monte Carlo results**: dispersion set with justifications, success criteria, CEP, high percentiles, failure count and the reliability claim it supports.
7. **Sensitivity drivers** and what you would change.
8. **Known limitations**: what the sim does not model, what you could not validate, and what would have to be tested on hardware.

Write section 8 first and honestly. It is the section that distinguishes an engineer from a demo, and it is the one an interviewer will find most convincing.

Success: a report someone who has never seen the project could audit, with every claim traceable to a plot or a test.`,
      },
    ],
    quiz: [
      {
        id: 'q_m48_rates',
        q: 'Why does navigation run at IMU rate, control at around 100 Hz, and guidance at only 1 to 2 Hz?',
        choices: [
          'To reduce total CPU load; the rates are otherwise arbitrary',
          'Because each loop is set by the bandwidth of what it must track: navigation must integrate inertial data without aliasing the vehicle motion, control must have its sample rate well above the closed-loop crossover and the structural modes it filters, while the guidance solution is a slowly varying plan that changes little in a second — and re-solving it more often would buy nothing while costing the largest computation in the system',
          'Because the convex solver cannot run faster than 2 Hz on any hardware',
          'Because telemetry bandwidth limits the guidance update rate',
        ],
        answer: 1,
        explain:
          'Rate selection follows bandwidth, not convenience. Inertial mechanisation must sample fast enough to capture vehicle angular rates and vibration without aliasing, which puts it at hundreds of hertz or more. The control loop needs roughly twenty to forty times its crossover frequency so the zero-order-hold phase lag stays small, plus enough headroom to filter flex modes. Guidance solves a boundary-value problem whose answer evolves on the timescale of the trajectory itself, so a fresh optimum once or twice a second is ample, and between solves the control loop tracks the existing plan. That separation is also what makes the deadline policy workable: a missed guidance cycle means flying a plan that is one second old, which is survivable, whereas a missed control cycle is not.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_m48_mekf',
        q: 'Why is the navigation filter formulated as a multiplicative, error-state EKF rather than estimating the quaternion directly?',
        choices: [
          'Because quaternions cannot be stored in floating point accurately',
          'Because a quaternion has four components and three degrees of freedom, so a direct covariance over it is singular and the unit-norm constraint is violated by linear updates; the error-state form keeps a full-rank three-parameter covariance for a small attitude perturbation applied multiplicatively to a reference quaternion, which is reset after each update',
          'Because the error state is smaller and therefore faster to compute',
          'Because the multiplicative form removes the need for a process noise model',
        ],
        answer: 1,
        explain:
          'The constraint is the whole issue. A four-component unit quaternion carries three degrees of freedom, so a 4x4 covariance is necessarily singular, and an additive Kalman update moves the estimate off the unit sphere, requiring a renormalisation the filter never accounted for. The multiplicative formulation splits the attitude into a reference quaternion, which carries the large rotation and stays exactly unit norm, and a small three-parameter error, which is what the filter estimates with a well-conditioned 3x3 covariance block. After each update the error is folded into the reference and reset to zero, so the linearisation is always about zero error, where it is excellent. This is the standard spacecraft and launch-vehicle navigation formulation, and being able to explain why is routine interview material.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m48_deadline',
        q: 'Your convex guidance solver misses its deadline on one cycle during the landing burn. What should the vehicle do?',
        choices: [
          'Enter safe mode and terminate the burn',
          'Continue flying the previous solution while it is still fresh enough to be valid, fall back to a closed-form law such as ZEM/ZEV if it is not, and record the event in telemetry — with the cost of each branch measured in the Monte Carlo campaign rather than assumed',
          'Reduce the node count and re-solve immediately within the same cycle',
          'Hold the last commanded thrust vector until the next successful solve',
        ],
        answer: 1,
        explain:
          'A landing burn has no passive safe state, so terminating is usually the worst option available. The previous guidance solution is a full open-loop plan valid for its whole horizon, so flying it for one more cycle costs only the divergence accumulated in that cycle — small, and measurable. The staleness limit is what makes this safe: after some age the plan no longer matches the state and must be abandoned for something computed from the current state, which is what a closed-form law gives you instantly. Retrying within the cycle risks missing the next deadline too and is exactly the behaviour a hard real-time design forbids. Holding the last thrust vector is subtly worse than holding the last plan, because the plan knows how the command was supposed to evolve.',
        b: 1.2,
        bloom: 'apply',
      },
      {
        id: 'q_m48_error_budget',
        q: 'What is the right way to build a landing-accuracy error budget?',
        choices: [
          'Simulate first and allocate the budget afterwards to match what you measured',
          'Decompose the requirement into navigation, guidance, control and site-knowledge contributions, allocate a share to each with explicit margin, push each allocation down to its own drivers, then verify against the measured Monte Carlo breakdown and investigate every disagreement',
          'Assign each subsystem an equal share of the total',
          'Allocate the entire budget to navigation, since it dominates',
        ],
        answer: 1,
        explain:
          'An error budget is a design tool: it turns one vehicle-level requirement into subsystem requirements that people can be held to, and it tells you where money and effort should go before anything is built. It is built top down with root-sum-square combination, explicit margin, and a stated assumption about independence — which is usually slightly wrong, since navigation error and control error share a wind field. Then it is verified bottom up against the measured contributions from the campaign. The disagreements are the valuable part: they show either a model you did not understand or a coupling you assumed away. Allocating after the fact converts the budget from a requirement into a description, and equal shares ignore what is actually cheap or expensive to improve.',
        b: 1.1,
        bloom: 'apply',
      },
      {
        id: 'q_m48_filter_consistency',
        q: 'Your navigation filter tracks truth well in simulation, but its reported covariance is far smaller than the actual error. Why does that matter?',
        choices: [
          'It does not, as long as the state estimate is accurate',
          'Because every consumer of the estimate trusts the covariance: the filter will under-weight new measurements and may reject valid ones as outliers, the guidance sees a confidence it does not have, and FDIR residual thresholds scaled by that covariance will produce false alarms or miss real faults',
          'Because a small covariance makes the filter run slower',
          'Because the covariance must equal the process noise to be valid',
        ],
        answer: 1,
        explain:
          'An overconfident filter is more dangerous than an inaccurate one, because it corrupts every decision made downstream. The Kalman gain is set by the ratio of state to measurement covariance, so an understated P makes the filter ignore the very measurements that would correct it — the classic divergence mechanism. Gating tests reject good data. FDIR monitors normalised by S trip on healthy noise or, worse, stay quiet through real faults. And guidance sizes its margins on a confidence that does not exist. The standard checks are the normalised estimation error squared against truth in simulation, and the normalised innovation squared, which works in flight because it needs no truth; both should sit inside their chi-squared bounds. The usual cures are honest process noise, modelling the unmodelled dynamics rather than tuning around them, and consistent handling of time correlation.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m48_integration_order',
        q: 'What is the right integration order for a GNC stack, and why?',
        choices: [
          'Connect everything at once, since only the integrated system matters',
          'Verify each subsystem in isolation against truth, then add exactly one subsystem at a time — controller with perfect navigation first, then real navigation, then real guidance, then fault management — so that any new failure is attributable to the single element just added',
          'Start with guidance, since it defines the mission',
          'Start with fault management, since it protects everything else',
        ],
        answer: 1,
        explain:
          'The reason is diagnostic, not aesthetic. Connect everything at once and a failure could come from any of half a dozen places and their interactions, and the search space is the product rather than the sum. Adding one element at a time makes each new failure attributable by construction. The specific order matters too: the controller with perfect state feedback establishes that the control design is sound before navigation error is allowed to confuse the picture; real navigation then shows how much of the tracking error is estimation; real guidance adds plan-level behaviour; fault management goes last because it reacts to everything else and will mask problems if it is present during earlier debugging. Each gate gets a written note recording what was measured, which is what makes the eventual V&V report writable.',
        b: 0.9,
        bloom: 'apply',
      },
      {
        id: 'q_m48_one_implementation',
        q: 'Why must the Python analysis layer call the same implementation as the C++ flight core rather than reimplementing the algorithms?',
        choices: [
          'To reduce the total lines of code',
          'Because two implementations drift: the analysis eventually verifies an algorithm that is not the one flying, and the divergence is silent — it shows up as a discrepancy between prediction and flight that is then attributed to the vehicle',
          'Because Python is too slow to run a duplicate implementation',
          'Because C++ and Python produce different floating-point results',
        ],
        answer: 1,
        explain:
          'This is one of the most common and most expensive mistakes in a real programme. A prototype exists in Python, the flight version is written in C++, and from then on every fix, every gain change and every edge case has to be applied twice. They diverge within weeks, usually in the corner cases nobody exercises, and the analysis then certifies an algorithm that differs from the one flying. Bind the flight core into Python instead — pybind11 or an equivalent — so there is exactly one implementation, verified once, used by both the simulation and the analysis. The Python layer then owns scenarios, plotting, campaigns and reporting, which is what it is good at, and none of the algorithms.',
        b: 1.0,
        bloom: 'understand',
      },
    ],
    cards: [
      {
        id: 'c_m48_rates',
        front: 'Typical GNC rate stack on a booster',
        back: 'Navigation at IMU rate (hundreds of Hz), control at 100 Hz or more, guidance re-solved at 1 to 2 Hz, mode management at a few Hz. Each rate is set by the bandwidth of what that loop must track, not by available CPU.',
      },
      {
        id: 'c_m48_error_budget',
        front: 'Error budget method',
        back: 'Decompose the vehicle requirement into navigation, guidance, control and site-knowledge contributions; allocate with explicit margin; root-sum-square; push each allocation down to its drivers; then verify bottom-up against the measured Monte Carlo breakdown.',
      },
      {
        id: 'c_m48_mekf',
        front: 'Why the attitude filter is multiplicative',
        back: 'A unit quaternion carries three degrees of freedom in four components, so a direct covariance is singular and additive updates break the norm. Estimate a three-parameter error applied multiplicatively to a reference quaternion, then fold it in and reset.',
      },
      {
        id: 'c_m48_zemzev',
        front: 'ZEM/ZEV guidance law',
        back: 'a = (6/tgo^2) ZEM - (2/tgo) ZEV, with ZEM = r_f - (r + v tgo + 0.5 g tgo^2) and ZEV = v_f - (v + g tgo). Minimum-energy, closed form, microseconds to evaluate — the natural fallback when the convex solver misses a deadline. Clamp tgo away from zero.',
        formula: true,
      },
      {
        id: 'c_m48_deadline_policy',
        front: 'Guidance deadline policy',
        back: 'Fresh solve, else hold the previous plan while it is young enough, else the closed-form law — and report which branch fired in telemetry. The cost of each branch is measured in the campaign, not assumed.',
      },
      {
        id: 'c_m48_filter_consistency',
        front: 'Filter consistency checks',
        back: 'NEES (normalised estimation error squared) against truth in simulation, and NIS (normalised innovation squared) in flight, since it needs no truth. Both should sit inside their chi-squared bounds. An overconfident filter corrupts gating, FDIR thresholds and guidance margins alike.',
      },
      {
        id: 'c_m48_integration_order',
        front: 'GNC integration order',
        back: 'Controller with perfect state feedback, then real navigation, then real guidance, then fault management — one subsystem at a time, so every new failure is attributable to the element just added. FDIR goes last because it masks problems during debugging.',
      },
      {
        id: 'c_m48_one_impl',
        front: 'One implementation rule',
        back: 'The analysis layer binds the flight core rather than reimplementing it. Two implementations drift silently, and the analysis ends up verifying an algorithm that is not the one flying.',
      },
      {
        id: 'c_m48_gain_schedule',
        front: 'What a launch-vehicle TVC controller is scheduled on',
        back: 'Dynamic pressure and mass, primarily — they set aerodynamic stability and control effectiveness. The schedule is verified by frozen-time margin plots across the dispersed envelope, not at the nominal point.',
      },
      {
        id: 'c_m48_flex_slosh',
        front: 'Flex and slosh in the control loop',
        back: 'Bending modes are handled by notch or roll-off filtering with attention to the sensor location relative to the mode shape (a node on the wrong side inverts the sign). Slosh is handled by bandwidth separation and by not exciting it, because notching a mode whose frequency migrates with fill level is fragile.',
      },
      {
        id: 'c_m48_known_limitations',
        front: 'The most valuable section of a V&V report',
        back: 'Known limitations: what the simulation does not model, what could not be validated, and what would have to be tested on hardware. Write it first and honestly — it is what separates an engineering result from a demo.',
      },
    ],
    tags: ['spacex-core', 'interview', 'project'],
    importance: 1.4,
  },

  {
    id: 't7_m49_interview_prep',
    track: 'gnc',
    tier: 7,
    title: 'GNC Interview Preparation',
    summary:
      'Convert everything you have built into performance under time pressure: five rehearsed project talks you can defend against a hostile panel, five derivations you can do at a whiteboard from memory, embedded-flavoured C++ that runs in a fixed footprint, and system-design answers that sound like someone who has shipped. Ends with a full timed mock loop.',
    prereqs: ['t7_m48_capstone'],
    hours: 100,
    topics: [
      'The project presentation: choosing five topics, building a 10 to 20 minute talk for each, and rehearsing the defence rather than the delivery',
      'Answering "what would you do differently" and "what was the hardest bug" without either arrogance or apology',
      'Whiteboard derivations under time pressure: the rocket equation, rigid-body equations of motion under thrust, the Kalman filter update, proportional navigation, Euler equations, the Clohessy-Wiltshire equations',
      'Deriving out loud: narrating assumptions, stating what you are about to do before doing it, and recovering visibly from an error',
      'C++ coding rounds: the standard algorithmic problems plus embedded-flavoured ones — ring buffers, fixed-point arithmetic, bit manipulation, memory-constrained algorithms, no allocation in the hot path',
      'Explaining a design decision in terms of a trade rather than a preference',
      'Systems and architecture rounds: design a GNC flight software stack, a Monte Carlo pipeline, an FDIR scheme, a sensor suite for a given mission',
      'Fermi estimation drills with vehicle numbers you should already know',
      'Controls, estimation and dynamics rounds: the questions that recur, and the follow-ups that separate memorisation from understanding',
      'Behavioural and STAR stories emphasising ownership, speed, and recovery from failure',
      'Framing self-taught projects as engineering results with numbers: RMSE, margins, run counts, solve times, not adjectives',
      'Resume and portfolio construction around artefacts that can be read: repositories, reports, plots',
      'Work authorisation and export-control eligibility documentation, handled early rather than at offer stage',
      'Adjacent entry roles — simulation, GNC software, site reliability for GNC infrastructure — as realistic vectors into the field',
    ],
    objectives: [
      'Deliver five distinct project talks of 10 to 20 minutes and defend each under adversarial questioning',
      'Reproduce six core derivations at a whiteboard from memory, narrating assumptions as you go',
      'Solve embedded-flavoured C++ problems with fixed memory and no allocation in the hot path',
      'Answer a systems-design prompt with a rate architecture, interface contracts, failure modes and a stated trade',
      'Quote the quantitative results of your own work from memory, with units',
    ],
    resources: [
      {
        title: 'Tactical and Strategic Missile Guidance',
        author: 'Paul Zarchan (AIAA)',
        kind: 'book',
        free: false,
        note: 'For the guidance derivations that come up at the whiteboard, with the simulation code to check yourself against.',
      },
      {
        title: 'Optimal State Estimation: Kalman, H-Infinity, and Nonlinear Approaches',
        author: 'Dan Simon',
        kind: 'book',
        free: false,
        note: 'The estimation round comes from this book more often than from any other.',
      },
      {
        title: 'Space Vehicle Dynamics and Control',
        author: 'Bong Wie (AIAA)',
        kind: 'book',
        free: false,
        note: 'For the dynamics round: Euler equations, gravity-gradient, TVC, flexible structures.',
      },
      {
        title: 'Effective Modern C++',
        author: 'Scott Meyers',
        kind: 'book',
        free: false,
        note: 'For the C++ round. Move semantics, smart pointers, and the questions interviewers actually ask.',
      },
      {
        title: 'LeetCode',
        kind: 'site',
        url: 'https://leetcode.com/',
        free: true,
        note: 'Medium difficulty, solved in C++, with attention to allocation and cache behaviour rather than only to big-O.',
      },
      {
        title: 'CppCon talks on real-time and embedded C++',
        kind: 'video',
        url: 'https://www.youtube.com/@CppCon',
        free: true,
        note: 'Search for the real-time, low-latency and embedded talks. Good source of the follow-up questions a C++ interviewer asks after the code works.',
      },
      {
        title: 'Convex Optimization for Trajectory Generation (tutorial)',
        author: 'Malyuta et al., IEEE Control Systems Magazine, 2022',
        kind: 'paper',
        url: 'https://arxiv.org/abs/2106.09125',
        free: true,
        note: 'Re-read the introduction and the lossless convexification section the week of the interview. It is the highest-yield material in the whole curriculum.',
      },
    ],
    exercises: [
      {
        id: 'ex_m49_talks',
        title: 'Five talks, rehearsed and defended',
        kind: 'build',
        hours: 24,
        prompt: `Prepare five distinct 10 to 20 minute technical talks. Suggested set: the convex landing guidance work; the navigation filter and its consistency analysis; the 6-DOF simulation architecture; the Monte Carlo campaign and what it revealed; and one failure — something that did not work and what you did about it.

For each:
1. Open with the problem and the requirement, not with the method. The first sentence should say what had to be true and why it was hard.
2. State your contribution in one sentence, with a number in it.
3. Show one plot that carries the argument, and be able to explain every axis, every unit and every outlier on it.
4. Close with limitations and what you would do next.

Then rehearse the **defence**, which is the part that is actually evaluated. Write out the twenty hardest questions somebody could ask — "why not an NLP?", "how do you know your filter is consistent?", "what is your worst case, not your average?", "what would break if the vehicle were twice as heavy?", "did you validate that, or just verify it?" — and answer each out loud, timed.

Success: five talks delivered to a real audience, and a written answer to all twenty questions. If you cannot answer one, that is a gap in the work, not in the talk.`,
      },
      {
        id: 'ex_m49_whiteboard',
        title: 'Six derivations, from memory, on a timer',
        kind: 'derivation',
        hours: 20,
        prompt: `These recur. Do each one on a whiteboard, out loud, in under fifteen minutes, with no notes, stating your assumptions as you go.

1. **The rocket equation.** From momentum conservation to dv = ve ln(m0/mf). Then: what does it say about staging, and why does it not contain thrust?
2. **Equations of motion of a rocket in powered flight.** Translational and rotational, in a body frame, with variable mass. Be explicit about why a naive application of F = ma to a variable-mass body is wrong and what the correct momentum argument gives.
3. **The Kalman filter measurement update.** Derive the gain that minimises the trace of the posterior covariance, then explain in one sentence what the gain does when R is enormous and when P is enormous.
4. **Proportional navigation.** From the line-of-sight rate to a_cmd = N Vc lambda_dot, and why N between 3 and 5.
5. **Euler's equations** for a rigid body, and from them the stability of rotation about each principal axis — including why the intermediate axis is unstable.
6. **The Clohessy-Wiltshire equations.** Linearise relative motion about a circular orbit, and read off the behaviour: the along-track drift from a radial offset, and the closed relative ellipse.

For each, write the assumptions you made in the margin. Half of what is being assessed is whether you know what you assumed.

Success: all six delivered inside the time limit, twice, on separate days, with the assumption list correct.`,
      },
      {
        id: 'ex_m49_embedded_cpp',
        title: 'The embedded-flavoured coding round',
        kind: 'code',
        lang: 'python',
        hours: 16,
        prompt: `Aerospace coding rounds lean toward fixed memory, no allocation, and integer arithmetic. Build the classic pieces here in Python to fix the algorithms in your head, then **re-implement every one of them in C++ with no heap allocation and a GoogleTest suite** — that version is the artefact you bring to the interview.

1. **RingBuffer**, fixed capacity, overwriting the oldest element when full. The one every flight system has, for telemetry, for delay lines, for moving averages. Get the wrap arithmetic right without a modulo in the hot path.
2. **Q15 fixed point.** q15_from_float saturates rather than wrapping — saturation is a design decision, and wrapping in a control loop means a full-scale sign reversal. q15_mul rounds rather than truncating: truncation biases every product toward zero, and a biased integrator drifts.
3. Then, in C++: a lock-free single-producer single-consumer queue for telemetry out of the control task, and a moving-average filter over the ring buffer with no division in the update.

Success: the Python tests pass, and you have a C++ repository with tests, benchmarks, and a note on the worst-case execution time of each operation.`,
        starter: `class RingBuffer:
    """Fixed-capacity buffer that overwrites the oldest element when full."""

    def __init__(self, capacity):
        raise NotImplementedError

    def push(self, x):
        """Append x, discarding the oldest element if the buffer is full."""
        raise NotImplementedError

    def __len__(self):
        raise NotImplementedError

    def is_full(self):
        raise NotImplementedError

    def to_list(self):
        """Contents, oldest first."""
        raise NotImplementedError


def q15_from_float(x):
    """Convert to Q15: round(x * 32768), SATURATED to [-32768, 32767]."""
    raise NotImplementedError


def q15_mul(a, b):
    """Q15 multiply with round-to-nearest: (a*b + (1 << 14)) >> 15."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the ring buffer wraps and keeps the newest',
            assert: `rb = RingBuffer(3)
for v in [1, 2, 3, 4, 5]:
    rb.push(v)
assert len(rb) == 3, "length must saturate at the capacity"
assert rb.is_full() is True
assert rb.to_list() == [3, 4, 5], "oldest first, oldest discarded; got %r" % (rb.to_list(),)
rb2 = RingBuffer(4)
rb2.push(9)
assert rb2.to_list() == [9] and len(rb2) == 1 and rb2.is_full() is False`,
          },
          {
            name: 'Q15 conversion saturates instead of wrapping',
            assert: `assert q15_from_float(0.5) == 16384, "0.5 in Q15"
assert q15_from_float(-0.5) == -16384
assert q15_from_float(1.0) == 32767, "must saturate at the positive full scale"
assert q15_from_float(-1.0) == -32768, "the negative full scale is representable"
assert q15_from_float(7.3) == 32767, "a large value saturates, never wraps"
assert q15_from_float(0.0) == 0`,
          },
          {
            name: 'Q15 multiply rounds rather than truncating',
            assert: `assert q15_mul(16384, 16384) == 8192, "0.5 * 0.5 = 0.25"
assert q15_mul(32767, 32767) in (32766, 32767), "nearly one squared is nearly one"
assert q15_mul(1, 16384) == 1, "rounding keeps the smallest product; truncation would give 0"
assert q15_mul(0, 12345) == 0`,
          },
          {
            name: 'the ring buffer never grows and never reorders',
            assert: `rb = RingBuffer(2)
seen = []
for v in range(100):
    rb.push(v)
    seen.append(len(rb))
assert max(seen) == 2, "the buffer must never exceed its capacity"
assert rb.to_list() == [98, 99], "and must stay in order"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m49_systems_round',
        title: 'Four systems-design answers',
        kind: 'analysis',
        hours: 16,
        prompt: `Systems rounds are graded on structure. Prepare four, each to a twenty-minute spoken answer with a diagram.

1. **Design the GNC flight software stack for a reusable booster.** Layers, rates, interfaces, mode management, redundancy, FDIR, what runs on which computer, what the failure response is at each level.
2. **Design a Monte Carlo verification pipeline.** Dispersion definition, case generation and seeding, execution and scale-out, scoring, storage, reporting, replay of a single case, and how it hooks into CI.
3. **Design an FDIR scheme for a sensor suite.** What is monitored, by what test, with what threshold and persistence, what isolation is possible with what redundancy, and what the recovery is for each fault.
4. **Choose a sensor suite for a propulsive landing** and defend it on cost, mass, accuracy, and failure behaviour.

Use the same skeleton each time: restate the requirement and ask the clarifying question that most changes the answer; state assumptions; give the decomposition; go deep on one part; then state failure modes, the trade you made, and what you would measure to know you were right.

Success: four answers delivered out loud in twenty minutes each, with a diagram, to someone who interrupts.`,
      },
      {
        id: 'ex_m49_mock_loop',
        title: 'The full mock loop, timed',
        kind: 'build',
        hours: 16,
        prompt: `Run the whole thing end to end, in one day, with real people and a real clock.

- 30 minute project presentation to a panel, with 15 minutes of questions.
- Two coding rounds, 45 minutes each, in C++, on a whiteboard or a shared editor with no autocomplete.
- One controls round: margins, discretisation, a right-half-plane zero, a gain schedule.
- One estimation round: derive the update, explain consistency, handle a non-Gaussian measurement, explain what happens when the filter is overconfident.
- One dynamics round: rotational equations of motion, attitude representations, a variable-mass argument.
- One systems round from the previous exercise.

Record yourself. Watch it back, which will be unpleasant and is the point. Score each round on: did you state assumptions, did you ask a clarifying question, did you narrate your reasoning, did you recover cleanly from your mistake, did you quote your own numbers with units.

Then fix the two weakest rounds and run it again a week later.

Success: two full loops, recorded, with a written self-assessment and a measurable improvement between them.`,
      },
    ],
    quiz: [
      {
        id: 'q_m49_rocket_eq',
        q: 'At the whiteboard: why does the rocket equation contain no thrust term?',
        choices: [
          'Because thrust is assumed constant and cancels out',
          'Because it is an integral of momentum exchange over the whole burn: what matters is the total mass expelled and the speed it left at, and the rate at which that happened affects the time taken and the gravity and drag losses, but not the ideal velocity change itself',
          'Because it applies only in vacuum, where thrust is zero',
          'Because thrust is absorbed into the specific impulse term',
        ],
        answer: 1,
        explain:
          'Integrating m dv = -ve dm from the initial to the final mass gives dv = ve ln(m0/mf) with no reference to how long it took. Thrust sets mass flow rate and therefore burn duration, which determines gravity loss, drag loss and structural loads — all of which are real and often dominant — but the ideal delta-v depends only on the exhaust velocity and the mass ratio. The follow-up an interviewer almost always asks is what this implies for staging: since delta-v grows only logarithmically with mass ratio, dropping dry mass mid-flight is the only way to get a large total delta-v, which is the whole argument for multiple stages. The second follow-up is why reusability is hard: recovery hardware is dry mass carried the whole way up, inside a logarithm.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'q_m49_variable_mass',
        q: 'Why is F = m*a wrong for a rocket, and what is the correct statement?',
        choices: [
          'It is not wrong; you simply use the instantaneous mass',
          'Because the second law applies to a fixed system of particles, whereas a rocket continuously ejects mass; the correct treatment applies momentum conservation to a control volume including the expelled propellant, which gives m dv/dt = T + F_ext with T = -ve dm/dt, so the thrust term appears from the momentum flux and not from d(mv)/dt',
          'Because relativistic corrections matter at orbital velocities',
          'Because the mass is not known accurately enough in flight',
        ],
        answer: 1,
        explain:
          'The trap is writing F = d(mv)/dt = m dv/dt + v dm/dt and treating the second term as a force. That is wrong, because it is frame-dependent: it would predict a thrust that changes if you change inertial frames, which is nonsense. The correct derivation takes a control volume containing the vehicle and the propellant about to leave, applies conservation of momentum to that fixed system of particles over an interval dt, and takes the limit. The thrust emerges as the momentum flux of the exhaust relative to the vehicle, m dv/dt = -ve dm/dt + external forces, and is properly frame-independent. Getting this right on a whiteboard, and being able to say why the naive version is wrong rather than just producing the right formula, is a standard discriminator in a dynamics round.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m49_kalman_gain',
        q: 'Explain the Kalman gain in one sentence each for the two limits.',
        choices: [
          'Large R means trust the measurement; large P means trust the model',
          'When R is very large the measurement is noisy, the gain goes to zero and the filter ignores it, propagating on the model alone; when P is very large the state is poorly known, the gain approaches the inverse of the measurement mapping and the filter essentially resets the state to whatever the measurement says',
          'The gain is always between zero and one and represents a fixed blending weight',
          'The gain depends only on the measurement noise, not on the state covariance',
        ],
        answer: 1,
        explain:
          'K = P H^T (H P H^T + R)^-1 is a ratio of confidences, and saying it that way is what an interviewer is listening for. When R dominates the denominator, K goes to zero: an untrustworthy measurement moves the estimate hardly at all. When P dominates, K approaches a pseudo-inverse of H: the prior is worthless and the filter takes the measurement at face value. The whole filter is that trade, computed optimally at every step in the sense of minimising the posterior error covariance. The useful follow-ups are that the gain is not confined to [0, 1] for a multi-state system, that P and R are the things you actually tune, and that a filter is overconfident — the most common real failure — when P is too small for the modelling error actually present.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'q_m49_pn',
        q: 'Why is the proportional navigation constant typically chosen between 3 and 5?',
        choices: [
          'Because larger values are numerically unstable',
          'Because N = 3 is the optimal value under a linear-quadratic formulation against a non-manoeuvring target with perfect information, while values slightly above it converge faster and tolerate estimation error and target manoeuvre better; much larger N amplifies line-of-sight rate noise into commanded acceleration and saturates the actuator',
          'Because N is limited by the number of gimbal axes',
          'Because N must be an integer for the guidance law to be well posed',
        ],
        answer: 1,
        explain:
          'The linear-quadratic derivation of intercept guidance with a free terminal miss and a quadratic acceleration cost produces exactly the PN structure with an effective navigation ratio of 3, which is the satisfying part of the derivation — PN is not a heuristic, it falls out of an optimal control problem. Values a little higher pull the trajectory straighter earlier, which leaves more control authority for late corrections and copes better with a manoeuvring target, and augmented PN adds a term proportional to the estimated target acceleration for exactly that reason. The upper limit is noise: the command is proportional to line-of-sight rate, which is the noisiest quantity in the seeker, so a large N converts seeker noise into full-scale acceleration commands and saturates the airframe. Three to five is where those two effects balance.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_m49_numbers',
        q: 'In a project talk, what makes a claim credible to a panel?',
        choices: [
          'Describing the difficulty of the work and the time it took',
          'A number with a unit and a stated method: "landing CEP of 4.2 m over 10,000 dispersed cases, with a 99.87th percentile of 11 m, scored against criteria defined before the campaign" rather than "the landing accuracy was good"',
          'A long list of the technologies used',
          'Showing the complete source code during the presentation',
        ],
        answer: 1,
        explain:
          'Panels are trying to establish whether you measured anything. Adjectives — robust, accurate, efficient — carry no information and invite exactly the follow-up you do not want. A number, its unit, how it was obtained and the sample it came from establishes in one sentence that the work was engineered rather than demonstrated. Give the worst case beside the central value, because that is what an aerospace panel actually cares about, and say what would break the result. The same discipline applies to the resume: "reduced attitude estimation error from 0.8 to 0.2 degrees RMS by modelling gyro bias instability, verified over 2,000 dispersed cases" is a line that has to be true, and it reads as such.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'q_m49_coding_round',
        q: 'In an aerospace C++ coding round, you produce a correct solution that allocates inside a loop. What should you say?',
        choices: [
          'Nothing; the solution is correct',
          'Point it out yourself and offer the fixed-footprint version: preallocate or use a fixed-capacity container, because allocation in a hot path is non-deterministic and is exactly what flight coding standards forbid',
          'Explain that modern allocators are fast enough that it does not matter',
          'Rewrite the whole solution in C',
        ],
        answer: 1,
        explain:
          'Correctness is the entry ticket, not the differentiator. What distinguishes a candidate for a flight software role is noticing the properties the domain cares about — allocation, worst-case behaviour, bounded loops, fixed footprint — and raising them before the interviewer does. Saying "this works, but it allocates per iteration, which I would not do in a control loop; here is the version with a preallocated buffer" demonstrates the judgement the job needs, and it costs thirty seconds. Arguing that allocators are fast misses the point entirely: the objection is determinism, not speed. The same instinct applies to unbounded recursion, to error handling on a path with no error return, and to anything whose execution time depends on data.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'q_m49_dont_know',
        q: 'You are asked a technical question you cannot answer. What is the best response?',
        choices: [
          'Guess confidently; admitting ignorance ends the interview',
          'Say what you do know that bounds the answer, state clearly which part you are unsure of, and then reason out loud toward it — offering how you would find out or test it; the round is assessing reasoning under uncertainty, which is most of engineering',
          'Say you do not know and wait for the next question',
          'Redirect to a topic you know well',
        ],
        answer: 1,
        explain:
          'Interviewers deliberately push past the edge of your knowledge, because that is where the informative signal is. The failure modes are bluffing, which is usually transparent and is disqualifying in a safety-critical field, and shutting down, which forfeits the round. What works is bounding: name the adjacent things you do know, state precisely what you are uncertain about, reason from principles toward a plausible answer, and say what experiment, calculation or reference would settle it. That is exactly what the job consists of. It also gives the interviewer something to work with — they will often supply the missing piece and continue, and how you use that correction is itself part of the assessment.',
        b: 0.5,
        bloom: 'apply',
      },
    ],
    cards: [
      {
        id: 'c_m49_rocket_eq',
        front: 'The rocket equation',
        back: 'dv = ve ln(m0/mf) = Isp g0 ln(m0/mf). No thrust term: thrust sets burn time and therefore gravity and drag losses, not the ideal delta-v. Logarithmic in mass ratio, which is the entire argument for staging.',
        formula: true,
      },
      {
        id: 'c_m49_variable_mass',
        front: 'Why F = ma is wrong for a rocket',
        back: 'Newton applies to a fixed set of particles; a rocket ejects mass. Use momentum conservation on a control volume containing the vehicle plus the propellant leaving in dt. The naive d(mv)/dt gives a frame-dependent and therefore wrong thrust term.',
      },
      {
        id: 'c_m49_kalman_gain',
        front: 'Kalman gain, stated as a trade',
        back: 'K = P H^T (H P H^T + R)^-1. Large R: gain to zero, ignore the measurement. Large P: gain to a pseudo-inverse of H, reset to the measurement. The filter is that ratio of confidences, computed optimally each step.',
        formula: true,
      },
      {
        id: 'c_m49_pn',
        front: 'Proportional navigation command',
        back: 'a_cmd = N * Vc * lambda_dot, applied perpendicular to the line of sight. N = 3 is LQ-optimal against a non-manoeuvring target; 3 to 5 in practice, because higher N amplifies seeker noise into saturating acceleration commands.',
        formula: true,
      },
      {
        id: 'c_m49_euler',
        front: "Euler's equations",
        back: 'I omega_dot + omega x (I omega) = M. In principal axes: I1 w1dot = (I2 - I3) w2 w3 + M1, and cyclic. The cross-coupling term is what makes intermediate-axis rotation unstable.',
        formula: true,
      },
      {
        id: 'c_m49_cw',
        front: 'Clohessy-Wiltshire behaviour, in words',
        back: 'Linearised relative motion about a circular orbit. A radial offset produces along-track DRIFT at 3n/2 per unit offset; a properly phased radial and along-track pair produces a closed 2-by-1 ellipse. The counterintuitive result: thrusting forward raises you and makes you fall behind.',
      },
      {
        id: 'c_m49_quaternion_kin',
        front: 'Quaternion kinematics',
        back: 'qdot = 0.5 * q x omega_body (Hamilton convention, body rate). Four parameters, three degrees of freedom, no singularity, unit norm constraint — which is why filters estimate a three-parameter error multiplicatively instead.',
        formula: true,
      },
      {
        id: 'c_m49_vis_viva',
        front: 'Vis-viva',
        back: 'v^2 = mu (2/r - 1/a). Specific orbital energy is -mu/(2a), so energy depends only on the semi-major axis. Both are one-line answers to a large fraction of orbital mechanics interview questions.',
        formula: true,
      },
      {
        id: 'c_m49_hohmann',
        front: 'Hohmann transfer delta-v, and when it is not optimal',
        back: 'Two tangential burns via an ellipse touching both circular orbits; minimum two-impulse cost for a ratio of radii below about 11.94. Above that, a bi-elliptic transfer is cheaper, at the cost of a far longer transfer time.',
        formula: true,
      },
      {
        id: 'c_m49_numbers_not_adjectives',
        front: 'How to state a result',
        back: 'A number, a unit, and the method: "CEP of 4.2 m over 10,000 dispersed cases, 99.87th percentile 11 m, criteria fixed before the run". Never "the accuracy was good". Give the worst case next to the central value.',
      },
      {
        id: 'c_m49_coding_round',
        front: 'What an aerospace coding round is really testing',
        back: 'Correctness is the entry ticket. The signal is whether you notice determinism: allocation in a hot path, unbounded loops, recursion, data-dependent execution time — and raise it yourself before the interviewer does.',
      },
      {
        id: 'c_m49_dont_know',
        front: 'Answering past the edge of your knowledge',
        back: 'Bound it: say what you do know, state exactly what you are unsure of, reason out loud toward an answer, and say what would settle it. Bluffing is disqualifying in a safety-critical field; silence forfeits the round.',
      },
      {
        id: 'c_m49_systems_skeleton',
        front: 'Skeleton for any systems-design answer',
        back: 'Restate the requirement and ask the one clarifying question that most changes the answer; state assumptions; give the decomposition; go deep on one part; finish with failure modes, the trade you made, and what you would measure to know you were right.',
      },
      {
        id: 'c_m49_highest_yield',
        front: 'Highest-yield material the week before a landing-GNC interview',
        back: 'Lossless convexification: why the thrust lower bound is non-convex, the slack relaxation, why it is tight, the log-mass change of variables, and why a bounded-iteration convex solve is certifiable where an NLP is not.',
      },
    ],
    tags: ['interview', 'career'],
    importance: 1.5,
  },
]
