/**
 * Torsion Analyzer – Circular Shafts
 * Ported from Python reference code (torsion_analyzer.py)
 *
 * Units: kN·m for torque, m for length, mm for diameters, GPa for G, MPa for stress, rad/deg for twist
 */

export const MATERIAL_PRESETS = {
  'Structural Steel (75-80 GPa)': 79.3,
  'Aluminum Alloy (25-28 GPa)': 26.0,
  'Titanium Alloy (40-45 GPa)': 44.0,
  'Copper (40-48 GPa)': 44.0,
  'Bronze/Brass (35-40 GPa)': 38.0,
  'Concrete (10-15 GPa)': 12.0,
  'Custom': 80.0,
};

/**
 * Validate and clamp shear modulus to real-world range [1, 150] GPa.
 * @param {number} G_GPa
 * @returns {{ G_GPa: number, warning: string|null }}
 */
export function validateShearModulus(G_GPa) {
  if (G_GPa < 1 || G_GPa > 150) {
    const clamped = Math.min(Math.max(G_GPa, 1), 150);
    return {
      G_GPa: clamped,
      warning: `Shear Modulus G must be between 1.0 GPa and 150.0 GPa for real-world structures. Value clamped to ${clamped} GPa.`,
    };
  }
  return { G_GPa, warning: null };
}

/**
 * Compute torsion parameters for a solid or hollow circular shaft.
 *
 * @param {'solid'|'hollow'} shaftType
 * @param {number} T_kNm  - Torque (kN·m)
 * @param {number} L_m    - Length (m)
 * @param {number} G_GPa  - Shear modulus (GPa) — already validated/clamped
 * @param {number} do_mm  - Outer diameter (mm)
 * @param {number} di_mm  - Inner diameter (mm, 0 for solid)
 * @returns {object} results
 */
export function analyzeTorsion(shaftType, T_kNm, L_m, G_GPa, do_mm, di_mm = 0) {
  const errors = [];
  if (do_mm <= 0) errors.push('Outer diameter must be greater than 0 mm.');
  if (shaftType === 'hollow') {
    if (di_mm <= 0) errors.push('Inner diameter must be greater than 0 mm for hollow shafts.');
    if (di_mm >= do_mm) errors.push('Inner diameter must be strictly less than outer diameter.');
  }
  if (errors.length) throw new Error(errors.join('\n'));

  // Convert to SI (N, m)
  const T = T_kNm * 1e3;           // N·m
  const L = L_m;                    // m
  const G = G_GPa * 1e9;            // Pa
  const do_ = do_mm / 1e3;          // m
  const ro = do_ / 2;
  const di = shaftType === 'hollow' ? di_mm / 1e3 : 0;
  const ri = di / 2;

  // Polar moment of inertia: J = π/32 · (do⁴ − di⁴)
  const J = (Math.PI / 32) * (do_ ** 4 - di ** 4);

  // Shear stress distribution
  const nPts = 100;
  const rVals = [];
  if (shaftType === 'hollow') {
    for (let i = 0; i < nPts; i++) rVals.push(ri + (ro - ri) * i / (nPts - 1));
  } else {
    for (let i = 0; i < nPts; i++) rVals.push(ro * i / (nPts - 1));
  }

  const tauVals = rVals.map(r => (T * r / J) / 1e6);  // MPa

  // Mirror for full-diameter plot: [−ro … +ro]
  const rPlot = [...rVals.slice().reverse().map(r => -r), ...rVals];
  const tauPlot = [...tauVals.slice().reverse().map(v => -v), ...tauVals];

  const tauMax = (T * ro / J) / 1e6;  // MPa
  const tauMin = shaftType === 'hollow' ? (T * ri / J) / 1e6 : 0;  // MPa at inner wall

  const thetaRad = (T * L) / (G * J);  // radians
  const thetaDeg = thetaRad * (180 / Math.PI);

  const torsionalStiffness = G * J / L / 1e3;  // kN·m/rad

  return {
    J_mm4: J * 1e12,   // mm⁴
    J_m4: J,           // m⁴
    tauMax,
    tauMin,
    thetaRad,
    thetaDeg,
    torsionalStiffness,
    rPlot_mm: rPlot.map(r => r * 1e3),  // mm for x-axis
    tauPlot,                              // MPa for y-axis
    ro_mm: ro * 1e3,
    ri_mm: ri * 1e3,
    isHollow: shaftType === 'hollow',
  };
}
