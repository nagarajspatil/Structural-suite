/**
 * Bending & Shear Stress Distribution – Cross-Section Analyzer
 * Ported from Python reference code (stress_distribution.py)
 *
 * Units: kN·m for M, kN for V, mm for dimensions, mm⁴ for I, MPa for stress
 */

/**
 * Rectangular cross-section.
 * @param {number} b - Width (mm)
 * @param {number} h - Height (mm)
 * @param {number} M_kNm - Bending moment (kN·m)
 * @param {number} V_kN  - Shear force (kN)
 * @returns {object} results
 */
export function analyzeRectangular(b, h, M_kNm, V_kN) {
  if (b <= 0 || h <= 0) throw new Error('Dimensions must be greater than zero.');

  const M = M_kNm * 1e6;  // N·mm
  const V = V_kN * 1e3;   // N

  const I = (b * h ** 3) / 12;  // mm⁴

  const nPts = 150;
  const yVals = Array.from({ length: nPts }, (_, i) => -h / 2 + h * i / (nPts - 1));

  const bendingStress = yVals.map(y => (M * y) / I);  // MPa (N/mm²)
  // Q = (b/2)(h²/4 − y²)
  const Q = yVals.map(y => (b / 2) * (h ** 2 / 4 - y ** 2));
  const t = yVals.map(() => b);
  const shearStress = yVals.map((y, i) => (V * Q[i]) / (I * t[i]));

  return { I, yVals, bendingStress, shearStress, depthLabel: h };
}

/**
 * Circular cross-section.
 * @param {number} d - Diameter (mm)
 * @param {number} M_kNm
 * @param {number} V_kN
 */
export function analyzeCircular(d, M_kNm, V_kN) {
  if (d <= 0) throw new Error('Diameter must be greater than zero.');

  const M = M_kNm * 1e6;
  const V = V_kN * 1e3;
  const r = d / 2;
  const I = (Math.PI * d ** 4) / 64;

  const nPts = 150;
  const yVals = Array.from({ length: nPts }, (_, i) => -r + d * i / (nPts - 1));

  const bendingStress = yVals.map(y => (M * y) / I);

  // Width at y: t = 2√(r² − y²)
  const tVals = yVals.map(y => 2 * Math.sqrt(Math.max(r ** 2 - y ** 2, 0)));
  // Q = (2/3)(r² − y²)^(3/2)
  const QVals = yVals.map(y => (2 / 3) * Math.pow(Math.max(r ** 2 - y ** 2, 0), 1.5));
  // Guard against divide-by-zero at extreme fibres
  const shearStress = yVals.map((y, i) => {
    const tSafe = tVals[i] < 1e-9 ? 1e-9 : tVals[i];
    return (V * QVals[i]) / (I * tSafe);
  });

  return { I, yVals, bendingStress, shearStress, depthLabel: d };
}

/**
 * I-Beam cross-section.
 * @param {number} b  - Flange width (mm)
 * @param {number} h  - Total height (mm)
 * @param {number} tf - Flange thickness (mm)
 * @param {number} tw - Web thickness (mm)
 * @param {number} M_kNm
 * @param {number} V_kN
 */
export function analyzeIBeam(b, h, tf, tw, M_kNm, V_kN) {
  if (b <= 0 || h <= 0 || tf <= 0 || tw <= 0)
    throw new Error('Dimensions must be greater than zero.');
  if (h <= 2 * tf)
    throw new Error('Inconsistent I-beam dimensions: total height must exceed 2 × flange thickness.');
  if (b <= tw)
    throw new Error('Inconsistent I-beam dimensions: flange width must exceed web thickness.');

  const M = M_kNm * 1e6;
  const V = V_kN * 1e3;
  const hw = h - 2 * tf;  // web height

  const I = ((b * h ** 3) - (b - tw) * hw ** 3) / 12;

  const nPts = 200;
  const yVals = Array.from({ length: nPts }, (_, i) => -h / 2 + h * i / (nPts - 1));

  const bendingStress = yVals.map(y => (M * y) / I);

  const QVals = [], tVals = [];
  for (const y of yVals) {
    const absY = Math.abs(y);
    if (absY >= hw / 2) {
      // In flange
      const t = b;
      const Q = (b / 2) * ((h / 2) ** 2 - absY ** 2);
      QVals.push(Q);
      tVals.push(t);
    } else {
      // In web
      const t = tw;
      const Q_flange = b * tf * (h - tf) / 2;
      const Q_web = (tw / 2) * ((hw / 2) ** 2 - absY ** 2);
      QVals.push(Q_flange + Q_web);
      tVals.push(t);
    }
  }

  const shearStress = yVals.map((y, i) => (V * QVals[i]) / (I * tVals[i]));

  return { I, yVals, bendingStress, shearStress, depthLabel: h, hw, tf, tw, b };
}
