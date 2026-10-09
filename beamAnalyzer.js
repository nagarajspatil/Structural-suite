/**
 * Beam Analyzer – SFD, BMD, Reactions, Points of Contraflexure
 * Ported EXACTLY from Python reference code (beam_analyzer.py)
 *
 * Sign convention:
 *   - x measured from the LEFT end
 *   - downward loads are POSITIVE
 *   - shear force: +ve when resultant of forces to the LEFT acts UPWARD
 *   - bending moment: SAGGING = +ve, HOGGING = -ve
 *
 * Units: kN and m throughout; moments in kN·m
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Load effects (vectorised over an array of x values)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For every section x, return V(x) and M(x) due to applied loads only
 * (reactions are NOT included here).
 *
 * @param {Float64Array|number[]} x       - section positions (m)
 * @param {Array<[number,number]>} pointLoads  - [[P, a], ...]  P in kN, a in m
 * @param {Array<[number,number,number]>} udls - [[w, l1, l2], ...]  w in kN/m
 * @param {Array<[number,number,number,number]>} uvls - [[w1, w2, l1, l2], ...]
 * @returns {{ V: Float64Array, M: Float64Array }}
 */
export function loadEffects(x, pointLoads, udls, uvls) {
  const n = x.length;
  const V = new Float64Array(n);
  const M = new Float64Array(n);

  for (const [P, a] of pointLoads) {
    for (let i = 0; i < n; i++) {
      if (x[i] >= a) {
        V[i] += P;
        M[i] += P * (x[i] - a);
      }
    }
  }

  for (const [w, l1, l2] of udls) {
    for (let i = 0; i < n; i++) {
      const c = Math.min(Math.max(x[i], l1), l2);  // clip(x, l1, l2)
      const lx = c - l1;
      V[i] += w * lx;
      M[i] += w * lx * (x[i] - (l1 + c) / 2);
    }
  }

  for (const [w1, w2, l1, l2] of uvls) {
    const k = (w2 - w1) / (l2 - l1);  // load gradient
    for (let i = 0; i < n; i++) {
      const c = Math.min(Math.max(x[i], l1), l2);
      const lx = c - l1;
      const d = x[i] - l1;
      V[i] += w1 * lx + k * lx * lx / 2;
      M[i] += w1 * (d * lx - lx * lx / 2) + k * (d * lx * lx / 2 - lx * lx * lx / 3);
    }
  }

  return { V, M };
}

/**
 * Total downward load F and its moment M0 about x = 0.
 */
export function totalForceAndMoment(L, pointLoads, udls, uvls) {
  const { V, M } = loadEffects([L], pointLoads, udls, uvls);
  const F = V[0];
  const M0 = F * L - M[0];  // moment about x=0
  return { F, M0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Propped-cantilever reaction (compatibility method, constant EI)
//    R_B = Σ P·s²(3L−s) / (2L³)   integrated for distributed loads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Numerically integrate ∫ w(s) · s²(3L−s) ds / (2L³) over [l1, l2].
 * Uses Simpson's rule with 200 panels for accuracy.
 */
function integrateProppedKernel(w1, w2, l1, l2, L, nPanels = 200) {
  const h = (l2 - l1) / nPanels;
  let sum = 0;
  for (let i = 0; i <= nPanels; i++) {
    const s = l1 + i * h;
    const k = (w2 - w1) / (l2 - l1);
    const ws = w1 + k * (s - l1);
    const kernel = ws * s * s * (3 * L - s);
    const weight = (i === 0 || i === nPanels) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += weight * kernel;
  }
  return (h / 3) * sum / (2 * L * L * L);
}

export function proppedCantileverRb(L, pointLoads, udls, uvls) {
  let Rb = 0;

  for (const [P, a] of pointLoads) {
    Rb += P * a * a * (3 * L - a) / (2 * L * L * L);
  }

  for (const [w, l1, l2] of udls) {
    Rb += integrateProppedKernel(w, w, l1, l2, L);
  }

  for (const [w1, w2, l1, l2] of uvls) {
    Rb += integrateProppedKernel(w1, w2, l1, l2, L);
  }

  return Rb;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Validation
// ─────────────────────────────────────────────────────────────────────────────

export function validateBeamInputs(L, pointLoads, udls, uvls, supportConfig, aPos, bPos) {
  const errors = [];
  if (!L || L <= 0) errors.push('Beam length must be a positive number.');
  if (!['1', '2', '3', '4'].includes(supportConfig))
    errors.push('Support configuration must be 1, 2, 3 or 4.');

  for (const [P, a] of pointLoads) {
    if (a < 0 || a > L)
      errors.push(`Point load at position ${a} m is outside the beam (0 to ${L} m).`);
  }
  for (const [w, l1, l2] of udls) {
    if (l1 < 0 || l2 > L || l1 >= l2)
      errors.push(`UDL requires 0 ≤ start < end ≤ L (got ${l1}, ${l2}).`);
  }
  for (const [w1, w2, l1, l2] of uvls) {
    if (l1 < 0 || l2 > L || l1 >= l2)
      errors.push(`UVL requires 0 ≤ start < end ≤ L (got ${l1}, ${l2}).`);
  }
  if (supportConfig === '4') {
    if (aPos == null || bPos == null)
      errors.push('Support positions a and b are required for an overhanging beam.');
    else if (aPos < 0 || aPos >= bPos || bPos > L)
      errors.push(`Need 0 ≤ a < b ≤ L for an overhanging beam (got a=${aPos}, b=${bPos}).`);
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Main solver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute SFD and BMD arrays, reactions, and support data.
 *
 * @param {number} L
 * @param {Array} pointLoads
 * @param {Array} udls
 * @param {Array} uvls
 * @param {string} supportConfig  '1'|'2'|'3'|'4'
 * @param {number|null} aPos
 * @param {number|null} bPos
 * @param {number} n  grid density (default 2000)
 * @returns {{ x, sf, bm, reactions }}
 */
export function calculateBeamComplete(L, pointLoads, udls, uvls, supportConfig, aPos, bPos, n = 2000) {
  const errors = validateBeamInputs(L, pointLoads, udls, uvls, supportConfig, aPos, bPos);
  if (errors.length) throw new Error(errors.join('\n'));

  const { F, M0 } = totalForceAndMoment(L, pointLoads, udls, uvls);

  let supports = [];
  let MFixed = 0;
  let reactions = {};

  if (supportConfig === '1') {
    const Rb = M0 / L;
    const Ra = F - Rb;
    supports = [[Ra, 0], [Rb, L]];
    reactions = { 'Ra (Hinge)': Ra, 'Rb (Roller)': Rb };

  } else if (supportConfig === '2') {
    MFixed = M0;
    supports = [[F, 0]];
    reactions = { 'Ra (Fixed)': F, 'Ma (Fixed-end moment, hogging)': MFixed };

  } else if (supportConfig === '3') {
    const Rb = proppedCantileverRb(L, pointLoads, udls, uvls);
    const Ra = F - Rb;
    MFixed = M0 - Rb * L;
    supports = [[Ra, 0], [Rb, L]];
    reactions = { 'Ra (Fixed)': Ra, 'Rb (Roller)': Rb, 'Ma (Fixed-end moment, hogging)': MFixed };

  } else {  // '4' overhanging
    const momentAboutA = M0 - F * aPos;
    const Rb = momentAboutA / (bPos - aPos);
    const Ra = F - Rb;
    supports = [[Ra, aPos], [Rb, bPos]];
    reactions = { 'Ra (Hinge)': Ra, 'Rb (Roller)': Rb };
  }

  // Build x grid: uniform + every load/support position ± ε
  const keyPositions = [0, L];
  for (const [, a] of pointLoads) keyPositions.push(a);
  for (const [, l1, l2] of udls) keyPositions.push(l1, l2);
  for (const [, , l1, l2] of uvls) keyPositions.push(l1, l2);
  for (const [, pos] of supports) keyPositions.push(pos);

  const eps = 1e-9 * L;
  const xSet = new Set();

  // Uniform grid
  for (let i = 0; i <= n; i++) xSet.add(i * L / n);

  // Key positions with offsets
  for (const k of keyPositions) {
    xSet.add(Math.max(0, Math.min(L, k)));
    xSet.add(Math.max(0, Math.min(L, k - eps)));
    xSet.add(Math.max(0, Math.min(L, k + eps)));
  }

  const x = Float64Array.from([...xSet].sort((a, b) => a - b));

  // Compute load effects
  const { V, M } = loadEffects(x, pointLoads, udls, uvls);

  // SFD and BMD
  const sf = new Float64Array(x.length);
  const bm = new Float64Array(x.length);

  for (let i = 0; i < x.length; i++) {
    sf[i] = -V[i];
    bm[i] = -M[i] - MFixed;
  }

  // Add reaction contributions
  for (const [R, pos] of supports) {
    for (let i = 0; i < x.length; i++) {
      if (x[i] >= pos) {
        sf[i] += R;
        bm[i] += R * (x[i] - pos);
      }
    }
  }

  // Clean floating-point noise
  const scaleVal = Math.max(1.0, ...bm.map(Math.abs), ...sf.map(Math.abs));
  for (let i = 0; i < x.length; i++) {
    if (Math.abs(sf[i]) < 1e-9 * scaleVal) sf[i] = 0;
    if (Math.abs(bm[i]) < 1e-9 * scaleVal) bm[i] = 0;
  }

  return { x: Array.from(x), sf: Array.from(sf), bm: Array.from(bm), reactions };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Points of contraflexure
// ─────────────────────────────────────────────────────────────────────────────

export function findContraflexure(x, bm) {
  const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const nzIdx = [];
  for (let i = 0; i < bm.length; i++) {
    if (sign(bm[i]) !== 0) nzIdx.push(i);
  }

  const pts = [];
  for (let k = 0; k < nzIdx.length - 1; k++) {
    const i = nzIdx[k], j = nzIdx[k + 1];
    if (sign(bm[i]) * sign(bm[j]) < 0) {
      if (j - i > 1) {
        pts.push(x[i + 1]);
      } else {
        pts.push(x[i] - bm[i] * (x[j] - x[i]) / (bm[j] - bm[i]));
      }
    }
  }
  return pts;
}
