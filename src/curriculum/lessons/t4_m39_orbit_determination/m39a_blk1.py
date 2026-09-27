import numpy as np
from scipy.integrate import solve_ivp
MU = 398600.4418                          # km^3/s^2

def G(r):                                 # gravity-gradient tensor
    rn = np.linalg.norm(r); rh = r/rn
    return MU/rn**3 * (3*np.outer(rh, rh) - np.eye(3))

def A_of(r):                              # two-body Jacobian A = df/dx
    A = np.zeros((6, 6)); A[:3, 3:] = np.eye(3); A[3:, :3] = G(r)
    return A

def f42(t, y):                            # state (6) and Phi (36), stacked
    r, v, Phi = y[:3], y[3:6], y[6:].reshape(6, 6)
    return np.concatenate([v, -MU*r/np.linalg.norm(r)**3, (A_of(r) @ Phi).ravel()])

x0 = np.array([3149.693, 4949.506, 3421.126, -6.090430, 0.695089, 4.601595])  # km, km/s
sol = solve_ivp(f42, (0, 3600), np.concatenate([x0, np.eye(6).ravel()]),
                method="DOP853", rtol=1e-13, atol=1e-13, dense_output=True)
Phi = sol.y[6:, -1].reshape(6, 6)
print("det Phi(1 h) =", np.linalg.det(Phi))

# does the integrated Phi obey its own equation?  d(Phi)/dt vs A Phi at t = 1800 s
P1, P2 = (sol.sol(t)[6:].reshape(6, 6) for t in (1799.0, 1801.0))
y_mid = sol.sol(1800.0)
dPhi_dt = (P2 - P1)/2.0
print("max |dPhi/dt - A Phi| =", np.max(np.abs(dPhi_dt - A_of(y_mid[:3]) @ y_mid[6:].reshape(6, 6))))
# det Phi(1 h) = 1.0000000000000009
# max |dPhi/dt - A Phi| = 1.3e-06
