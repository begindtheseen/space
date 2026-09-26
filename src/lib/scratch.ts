/* ============================================================================
   The playground's sample programs
   ----------------------------------------------------------------------------
   What each language opens on, in the playground and wherever the playground
   is embedded (a lesson's "Try it here"), and the telemetry table SQL runs on.
   ========================================================================== */

export const SCRATCH: Record<string, string> = {
  python: `# Two-body propagation, Euler-Cromer.
# A rough integrator on purpose — watch the energy drift.
import numpy as np
import matplotlib.pyplot as plt

MU = 398600.4418          # km^3/s^2, Earth
r = np.array([7000.0, 0.0])
v = np.array([0.0, 7.546])
dt, steps = 10.0, 3000

track = np.zeros((steps, 2))
for i in range(steps):
    a = -MU * r / np.linalg.norm(r) ** 3
    v = v + a * dt
    r = r + v * dt
    track[i] = r

plt.figure(figsize=(4.2, 4.2))
plt.plot(track[:, 0], track[:, 1], lw=1)
plt.gca().add_patch(plt.Circle((0, 0), 6378, color="#1b4a78"))
plt.axis("equal"); plt.grid(alpha=.15)
plt.title("LEO, 3000 steps")
plt.show()

print("final radius:", round(float(np.linalg.norm(r)), 1), "km")
`,
  sql: `-- Telemetry is where SQL earns its place in aerospace work.
SELECT
  channel,
  COUNT(*)                AS samples,
  ROUND(AVG(value), 2)    AS mean,
  ROUND(MAX(value), 2)    AS peak
FROM telemetry
GROUP BY channel
HAVING COUNT(*) > 2
ORDER BY peak DESC;
`,
  cpp: `#include <cstdio>

int main() {
    std::printf("Hello from a C++ exercise\\n");
    return 0;
}
`,
  rust: `fn main() {
    println!("Hello from a Rust exercise");
}
`,
  matlab: `% Runs on GNU Octave in the desktop app when it is installed.
mu = 398600.4418;
r  = [7000; 0; 0];
v  = [0; 7.546; 0];
h  = cross(r, v);
disp(norm(h))
`,
  bash: `#!/usr/bin/env bash
set -euo pipefail
echo "Hello from a shell exercise"
`,
  simulink: '',
  text: '',
}

/** Seed data for the standalone SQL scratchpad. */
export const SQL_SCHEMA = `
CREATE TABLE telemetry (t REAL, channel TEXT, value REAL);
INSERT INTO telemetry VALUES
  (0.0,'chamber_pressure',  98.2), (0.1,'chamber_pressure',  99.4),
  (0.2,'chamber_pressure', 101.7), (0.3,'chamber_pressure', 100.9),
  (0.0,'gimbal_angle',       0.4), (0.1,'gimbal_angle',      -1.2),
  (0.2,'gimbal_angle',       2.8), (0.3,'gimbal_angle',       1.1),
  (0.0,'accel_axial',       12.4), (0.1,'accel_axial',       19.8),
  (0.2,'accel_axial',       24.1), (0.3,'accel_axial',       31.6),
  (0.0,'tank_level',        99.9), (0.1,'tank_level',        92.3);
`

/** What C++ reads from standard input when it opens: nothing, until she types some. */
export const CPP_STDIN = ''
