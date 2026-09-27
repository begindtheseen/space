import numpy as np
from scipy.optimize import minimize

def h(x): return np.arctan2(x[1], x[0])
def Hjac(x):
    r2 = x[0]**2 + x[1]**2
    return np.array([-x[1]/r2, x[0]/r2])

def wrap(a): return (a+np.pi) % (2*np.pi) - np.pi

x0m = np.array([200.0, 200.0]); P0 = np.diag([80.0**2, 80.0**2])
sigma_th = np.radians(0.5); R = sigma_th**2
x_true = np.array([80.0, 260.0]); z = h(x_true)
P0inv = np.linalg.inv(P0)

x_iter = x0m.copy()
for i in range(6):
    Hi = Hjac(x_iter)
    Si = Hi@P0@Hi.T + R
    Ki = P0@Hi.T/Si
    resid = wrap(z - h(x_iter) - Hi@(x0m-x_iter))
    x_iter = x0m + Ki*resid

def cost(x):
    dx = x-x0m
    rz = wrap(z - h(x))
    return 0.5*dx@P0inv@dx + 0.5*rz**2/R

res = minimize(cost, x0m, method='Nelder-Mead',
                options=dict(xatol=1e-12, fatol=1e-16, maxiter=50000, maxfev=50000))
print(x_iter, res.x, np.linalg.norm(x_iter-res.x))
# [ 73.6228315  238.93972163] [ 73.6228299  238.93971622] 5.6e-06
