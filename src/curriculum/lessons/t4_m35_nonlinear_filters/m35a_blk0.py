import numpy as np

def wrap(a): return (a+np.pi) % (2*np.pi) - np.pi
def h(x): return np.arctan2(x[1], x[0])
def Hjac(x):
    r2 = x[0]**2+x[1]**2
    return np.array([-x[1]/r2, x[0]/r2, 0.0, 0.0])

dt = 1.0
F = np.array([[1,0,dt,0],[0,1,0,dt],[0,0,1,0],[0,0,0,1]])
q = 0.01
Q = q*np.array([[dt**3/3,0,dt**2/2,0],[0,dt**3/3,0,dt**2/2],
                [dt**2/2,0,dt,0],[0,dt**2/2,0,dt]])
sigma_th = np.radians(2.0); R = sigma_th**2

def run(seed, show=()):
    rng = np.random.default_rng(seed)
    x_true = np.array([300.0, 50.0, -11.0, -1.0])
    x = x_true.copy(); P = np.diag([60.0**2,60.0**2,2.0**2,2.0**2])
    nees = []
    for k in range(40):
        x_true = F@x_true + rng.multivariate_normal(np.zeros(4), Q)
        z = h(x_true) + rng.normal(0, sigma_th)
        xm = F@x; Pm = F@P@F.T + Q
        Hm = Hjac(xm)
        S = Hm@Pm@Hm.T + R
        K = Pm@Hm.T/S
        x = xm + K*wrap(z-h(xm))
        P = (np.eye(4)-np.outer(K,Hm))@Pm
        e = x_true - x
        nees.append(e@np.linalg.solve(P, e))
        if k+1 in show:
            print(k+1, np.round(xm[:2],2), round(np.hypot(*xm[:2]),2), round(np.trace(P[:2,:2]),2))
    return np.array(nees)

run(7, show=(26, 27))
# 26 [53.96 21.14] 57.95 965.54
# 27 [-3.94  5.49] 6.76 2.5

late = np.array([run(1000+s)[-10:].mean() for s in range(50)])
print(np.median(late), late.mean(), (late > 20).sum(), late.max())
# 3.84... 49.17... 5 1813.57...
