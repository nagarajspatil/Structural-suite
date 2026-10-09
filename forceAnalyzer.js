/**
 * Force System Analyzer - Pure Calculation Functions
 * Ported from Python reference code (force_analyzer.py)
 * Units: N for forces, m for positions, N·m for moments, degrees for angles
 */

/**
 * Compute components, moment contribution, and running totals for a set of forces.
 * @param {Array<{mag: number, angle: number, x: number, y: number}>} forces
 * @returns {object} results object with per-force details and totals
 */
export function analyzeForces(forces) {
  let sumFx = 0, sumFy = 0, sumM = 0;
  const details = [];

  for (let i = 0; i < forces.length; i++) {
    const { mag, angle, x, y } = forces[i];
    const rad = (angle * Math.PI) / 180;
    const fx = mag * Math.cos(rad);
    const fy = mag * Math.sin(rad);
    const momentContrib = x * fy - y * fx;  // M = x*Fy - y*Fx (about origin)
    sumFx += fx;
    sumFy += fy;
    sumM += momentContrib;

    details.push({
      index: i + 1,
      mag, angle, x, y,
      fx, fy,
      momentContrib,
      runningMoment: sumM,
    });
  }

  // Resultant
  const resMag = Math.sqrt(sumFx * sumFx + sumFy * sumFy);
  // Use Math.atan2 (equivalent to np.arctan2 in Python – corrects the np.atan2 bug)
  const resAngRad = Math.atan2(sumFy, sumFx);
  const resAngle = ((resAngRad * 180) / Math.PI + 360) % 360;

  return {
    details,
    sumFx,
    sumFy,
    sumM,
    resMag,
    resAngle,
  };
}

/**
 * Compute quiver scale so the longest displayed arrow is ~35% of the plot range.
 * @param {number} maxForceLen  magnitude of longest force vector (data units)
 * @param {number} limit        half-width of the plot range
 * @returns {number} scale factor (data units per arrow unit)
 */
export function computeQuiverScale(maxForceLen, limit) {
  if (maxForceLen <= 0) return 1;
  const scale = maxForceLen / (0.35 * limit);
  return scale < 0.1 ? 1 : scale;
}

/**
 * Determine axis limits from all force application points and vector endpoints.
 * @param {object} result  output of analyzeForces()
 * @returns {number} limit (half-width)
 */
export function computePlotLimit(result) {
  const allX = [0], allY = [0];
  for (const d of result.details) {
    allX.push(d.x, d.x + d.fx);
    allY.push(d.y, d.y + d.fy);
  }
  const maxCoord = Math.max(...allX.map(Math.abs), ...allY.map(Math.abs), 1);
  return Math.max(maxCoord * 1.5, result.resMag * 0.1 + 5);
}
