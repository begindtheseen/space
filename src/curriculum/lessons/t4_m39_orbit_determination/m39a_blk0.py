import numpy as np
MU = 398600.4418   # km^3/s^2

def accel(r):
    return -MU*r/np.linalg.norm(r)**3

def G_analytic(r):
    rn = np.linalg.norm(r)
    rhat = r/rn
    return MU/rn**3 * (3*np.outer(rhat, rhat) - np.eye(3))

r0 = np.array([3149.693, 4949.506, 3421.126])   # km
G_a = G_analytic(r0)
h = 1e-4                                        # km
G_fd = np.column_stack([(accel(r0 + h*e) - accel(r0 - h*e))/(2*h) for e in np.eye(3)])
print("largest entry of G:", np.max(np.abs(G_a)))
print("max |G_analytic - G_fd| =", np.max(np.abs(G_a - G_fd)))
print("trace(G) =", np.trace(G_a))
# largest entry of G: 1.4e-06
# max |G_analytic - G_fd| = 7.5e-15
# trace(G) = -3.2e-22
