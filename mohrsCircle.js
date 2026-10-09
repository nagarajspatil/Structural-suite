/**
 * Principal Stress & Strain Analyzer (Mohr's Circle)
 * Ported from Python reference code (stress_analyzer.py)
 * Units: MPa for stress/strain inputs, dimensionless for Poisson's ratio
 */

/**
 * Compute principal stresses, strains, and Mohr's circle parameters.
 * @param {number} sigmaX - Normal stress σx (MPa)
 * @param {number} sigmaY - Normal stress σy (MPa)
 * @param {number} tauXY  - Shear stress τxy (MPa)
 * @param {number} E      - Modulus of Elasticity (MPa)
 * @param {number} nu     - Poisson's ratio ν (dimensionless)
 * @returns {object} results
 */
export function analyzePrincipalStress(sigmaX, sigmaY, tauXY, E, nu) {
  const sigmaAvg = (sigmaX + sigmaY) / 2;
  const radius = Math.sqrt(((sigmaX - sigmaY) / 2) ** 2 + tauXY ** 2);

  const sigma1 = sigmaAvg + radius;
  const sigma2 = sigmaAvg - radius;
  const tauMax = radius;

  // Principal strains (plane stress)
  const epsilon1 = (1 / E) * (sigma1 - nu * sigma2);
  const epsilon2 = (1 / E) * (sigma2 - nu * sigma1);

  // Principal angle θp = ½ · atan2(2τxy, σx − σy)  [in degrees]
  const thetaP = 0.5 * Math.atan2(2 * tauXY, sigmaX - sigmaY) * (180 / Math.PI);

  return {
    sigmaAvg,
    radius,
    sigma1,
    sigma2,
    tauMax,
    epsilon1,
    epsilon2,
    thetaP,
  };
}

/**
 * Generate points for drawing Mohr's Circle.
 * @param {number} sigmaAvg - Center of the circle
 * @param {number} radius   - Radius of the circle
 * @param {number} n        - Number of points (default 100)
 * @returns {{ x: number[], y: number[] }}
 */
export function mohrsCirclePoints(sigmaAvg, radius, n = 100) {
  const x = [], y = [];
  for (let i = 0; i <= n; i++) {
    const theta = (2 * Math.PI * i) / n;
    x.push(sigmaAvg + radius * Math.cos(theta));
    y.push(radius * Math.sin(theta));
  }
  return { x, y };
}
