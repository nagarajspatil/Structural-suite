/**
 * Unit Tests for all 5 Analysis Modules
 * Framework: Vitest-compatible but also runnable standalone in Node.js / browser
 *
 * Run with:  npx vitest  OR  node tests/unit.test.js
 */

// ─── Inline test harness (no dependencies) ───────────────────────────────────
let passed = 0, failed = 0;

function describe(name, fn) {
  console.log(`\n📐 ${name}`);
  fn();
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}\n     ${e.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      const tol = 0.5 * Math.pow(10, -precision);
      if (diff > tol) {
        throw new Error(`Expected ${actual} to be close to ${expected} (±${tol})`);
      }
    },
    toBe(expected) {
      if (actual !== expected) throw new Error(`Expected ${actual} to be ${expected}`);
    },
    toHaveLength(n) {
      if (actual.length !== n) throw new Error(`Expected length ${actual.length} to be ${n}`);
    },
    toBeGreaterThan(n) {
      if (actual <= n) throw new Error(`Expected ${actual} > ${n}`);
    },
    toBeLessThan(n) {
      if (actual >= n) throw new Error(`Expected ${actual} < ${n}`);
    },
    toContain(val) {
      if (!actual.includes(val)) throw new Error(`Expected array to contain ${val}`);
    },
  };
}

// ─── Import libs (ES module style – loaded via importmap in browser) ──────────
import { analyzeForces } from '../src/lib/forceAnalyzer.js';
import { analyzePrincipalStress, mohrsCirclePoints } from '../src/lib/mohrsCircle.js';
import { calculateBeamComplete, findContraflexure, proppedCantileverRb } from '../src/lib/beamAnalyzer.js';
import { analyzeTorsion } from '../src/lib/torsionAnalyzer.js';
import { analyzeRectangular, analyzeCircular, analyzeIBeam } from '../src/lib/crossSectionAnalyzer.js';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: Force System Analyzer
// ─────────────────────────────────────────────────────────────────────────────
describe('Force System Analyzer', () => {

  test('Single horizontal force: Fx = F, Fy = 0', () => {
    const r = analyzeForces([{ mag: 100, angle: 0, x: 0, y: 0 }]);
    expect(r.sumFx).toBeCloseTo(100, 4);
    expect(r.sumFy).toBeCloseTo(0, 4);
    expect(r.resMag).toBeCloseTo(100, 4);
    expect(r.resAngle).toBeCloseTo(0, 2);
  });

  test('Single vertical force: Fx = 0, Fy = F', () => {
    const r = analyzeForces([{ mag: 100, angle: 90, x: 0, y: 0 }]);
    expect(r.sumFx).toBeCloseTo(0, 4);
    expect(r.sumFy).toBeCloseTo(100, 4);
    expect(r.resAngle).toBeCloseTo(90, 2);
  });

  test('Two equal opposing forces: resultant = 0', () => {
    const r = analyzeForces([
      { mag: 100, angle: 0, x: 0, y: 0 },
      { mag: 100, angle: 180, x: 0, y: 0 },
    ]);
    expect(r.resMag).toBeCloseTo(0, 4);
    expect(r.sumFx).toBeCloseTo(0, 4);
  });

  test('Moment about origin: M = x·Fy − y·Fx', () => {
    // F = 50N at 90° applied at (3, 0): M = 3*50 - 0 = 150 Nm
    const r = analyzeForces([{ mag: 50, angle: 90, x: 3, y: 0 }]);
    expect(r.sumM).toBeCloseTo(150, 2);
  });

  test('45° force decomposition', () => {
    const mag = 100;
    const r = analyzeForces([{ mag, angle: 45, x: 0, y: 0 }]);
    expect(r.sumFx).toBeCloseTo(mag * Math.cos(Math.PI / 4), 4);
    expect(r.sumFy).toBeCloseTo(mag * Math.sin(Math.PI / 4), 4);
  });

  test('Result angle uses mod 360 (270° force)', () => {
    const r = analyzeForces([{ mag: 100, angle: 270, x: 0, y: 0 }]);
    expect(r.resAngle).toBeCloseTo(270, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: Mohr's Circle
// Benchmark: σx=80, σy=20, τxy=40 MPa
// σavg=50, R=50, σ1=100, σ2=0, τmax=50
// ─────────────────────────────────────────────────────────────────────────────
describe("Principal Stress Analyzer (Mohr's Circle)", () => {

  const r80_20_40 = analyzePrincipalStress(80, 20, 40, 200000, 0.3);

  test('σavg = (σx+σy)/2 = 50', () => expect(r80_20_40.sigmaAvg).toBeCloseTo(50, 4));
  test('R = √((30)²+(40)²) = 50', () => expect(r80_20_40.radius).toBeCloseTo(50, 4));
  test('σ1 = 100 MPa', () => expect(r80_20_40.sigma1).toBeCloseTo(100, 3));
  test('σ2 = 0 MPa', () => expect(r80_20_40.sigma2).toBeCloseTo(0, 3));
  test('τmax = 50 MPa', () => expect(r80_20_40.tauMax).toBeCloseTo(50, 3));

  test('Principal strains (σx=200, σy=100, τxy=0, E=200000, ν=0.3)', () => {
    const r = analyzePrincipalStress(200, 100, 0, 200000, 0.3);
    // σ1=200, σ2=100 => ε1=(200 − 0.3*100)/200000 = 0.00085
    expect(r.epsilon1).toBeCloseTo(0.00085, 6);
    expect(r.epsilon2).toBeCloseTo(0.00020, 6);
  });

  test('Mohr circle generates 101 points', () => {
    const { x, y } = mohrsCirclePoints(50, 50, 100);
    expect(x).toHaveLength(101);
    expect(y).toHaveLength(101);
  });

  test('θp for pure shear (σx=0, σy=0, τxy=50) = 45°', () => {
    const r = analyzePrincipalStress(0, 0, 50, 200000, 0.3);
    expect(Math.abs(r.thetaP)).toBeCloseTo(45, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: Beam Analyzer
// Benchmark: simply supported 10m beam, UDL 20 kN/m
//   Ra = Rb = 100 kN, Mmax = 250 kNm at midspan
// ─────────────────────────────────────────────────────────────────────────────
describe('Beam Analyzer', () => {

  test('SS beam 10m, UDL 20kN/m: Ra = Rb = 100 kN', () => {
    const { reactions } = calculateBeamComplete(10, [], [[20, 0, 10]], [], '1', null, null);
    expect(reactions['Ra (Hinge)']).toBeCloseTo(100, 1);
    expect(reactions['Rb (Roller)']).toBeCloseTo(100, 1);
  });

  test('SS beam 10m, UDL 20kN/m: Mmax = 250 kNm', () => {
    const { bm } = calculateBeamComplete(10, [], [[20, 0, 10]], [], '1', null, null);
    expect(Math.max(...bm)).toBeCloseTo(250, 0);
  });

  test('SS beam 10m, point load 100kN at centre: Mmax = 250 kNm', () => {
    const { bm, reactions } = calculateBeamComplete(10, [[100, 5]], [], [], '1', null, null);
    expect(reactions['Ra (Hinge)']).toBeCloseTo(50, 1);
    expect(Math.max(...bm)).toBeCloseTo(250, 1);
  });

  test('Cantilever 5m, point load 20kN at tip: Ma = 100 kNm', () => {
    const { reactions } = calculateBeamComplete(5, [[20, 5]], [], [], '2', null, null);
    expect(reactions['Ra (Fixed)']).toBeCloseTo(20, 1);
    expect(reactions['Ma (Fixed-end moment, hogging)']).toBeCloseTo(100, 1);
  });

  test('Propped cantilever 6m, UDL 10kN/m: Rb = 3(10*6)/(8) = 22.5 kN', () => {
    // Standard result: Rb = 3wL/8
    const { reactions } = calculateBeamComplete(6, [], [[10, 0, 6]], [], '3', null, null);
    expect(reactions['Rb (Roller)']).toBeCloseTo(22.5, 0);
  });

  test('Overhanging beam: reactions sum to total load', () => {
    const { reactions } = calculateBeamComplete(8, [[30, 2], [20, 6]], [], [], '4', 2, 6);
    const total = Object.values(reactions).reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(50, 1);
  });

  test('Points of contraflexure found for overhanging beam', () => {
    const { x, bm } = calculateBeamComplete(8, [[50, 0]], [], [], '1', null, null);
    const cps = findContraflexure(x, bm);
    // Simply supported with end point load at x=0 → no contraflexure (all sagging)
    expect(cps.length).toBe(0);
  });

  test('SFD boundary conditions: SF=0 at free end of cantilever', () => {
    const { x, sf } = calculateBeamComplete(4, [[10, 4]], [], [], '2', null, null);
    const sfAtEnd = sf[sf.length - 1];
    expect(Math.abs(sfAtEnd)).toBeCloseTo(0, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: Torsion Analyzer
// ─────────────────────────────────────────────────────────────────────────────
describe('Torsion Analyzer', () => {

  test('Solid shaft: J = π/32 · d⁴', () => {
    const r = analyzeTorsion('solid', 5, 2, 79.3, 100);
    const expectedJ = (Math.PI / 32) * (0.1 ** 4) * 1e12;  // mm⁴
    expect(r.J_mm4).toBeCloseTo(expectedJ, -2);
  });

  test('Hollow shaft: J = π/32 · (do⁴ − di⁴)', () => {
    const r = analyzeTorsion('hollow', 5, 2, 79.3, 100, 60);
    const expectedJ = (Math.PI / 32) * ((0.1 ** 4) - (0.06 ** 4)) * 1e12;
    expect(r.J_mm4).toBeCloseTo(expectedJ, -2);
  });

  test('τmax = T·ro / J', () => {
    const do_mm = 100, T_kNm = 5;
    const r = analyzeTorsion('solid', T_kNm, 2, 79.3, do_mm);
    const J = (Math.PI / 32) * (0.1 ** 4);
    const expected = (T_kNm * 1e3 * 0.05) / J / 1e6;
    expect(r.tauMax).toBeCloseTo(expected, 2);
  });

  test('θ = TL/(GJ) in radians', () => {
    const r = analyzeTorsion('solid', 5, 2, 79.3, 100);
    const J = (Math.PI / 32) * (0.1 ** 4);
    const expected = (5e3 * 2) / (79.3e9 * J);
    expect(r.thetaRad).toBeCloseTo(expected, 6);
  });

  test('Error: inner diameter ≥ outer diameter', () => {
    let threw = false;
    try { analyzeTorsion('hollow', 5, 2, 79.3, 80, 100); } catch { threw = true; }
    expect(threw).toBe(true);
  });

  test('Torsional stiffness = GJ/L in kN·m/rad', () => {
    const r = analyzeTorsion('solid', 5, 2, 79.3, 100);
    const J = (Math.PI / 32) * (0.1 ** 4);
    const expected = (79.3e9 * J) / 2 / 1e3;
    expect(r.torsionalStiffness).toBeCloseTo(expected, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: Cross-Section Analyzer
// ─────────────────────────────────────────────────────────────────────────────
describe('Cross-Section Analyzer (Bending & Shear Stress)', () => {

  test('Rectangular: I = bh³/12', () => {
    const r = analyzeRectangular(150, 300, 50, 80);
    expect(r.I).toBeCloseTo(150 * 300 ** 3 / 12, -3);
  });

  test('Rectangular: max bending stress at y = ±h/2', () => {
    const r = analyzeRectangular(100, 200, 10, 0);
    const M = 10e6;
    const I = 100 * 200 ** 3 / 12;
    const expected = M * 100 / I;
    expect(Math.max(...r.bendingStress.map(Math.abs))).toBeCloseTo(expected, 1);
  });

  test('Rectangular: parabolic shear, max at NA (y=0)', () => {
    const r = analyzeRectangular(100, 200, 0, 50);
    const maxShear = Math.max(...r.shearStress);
    // τmax_rect = 3V/(2A) = 3*50000/(2*100*200) = 3.75 MPa
    expect(maxShear).toBeCloseTo(3.75, 1);
  });

  test('Circular: I = πd⁴/64', () => {
    const r = analyzeCircular(200, 50, 80);
    expect(r.I).toBeCloseTo(Math.PI * 200 ** 4 / 64, -3);
  });

  test('Circular: max shear stress at NA = 4V/(3A)', () => {
    const r = analyzeCircular(200, 0, 100);
    const V = 100e3;
    const A = Math.PI * 100 ** 2;
    const expected = (4 * V) / (3 * A);
    expect(Math.max(...r.shearStress)).toBeCloseTo(expected, 2);
  });

  test('I-Beam: I computed correctly', () => {
    const b = 200, h = 400, tf = 20, tw = 12;
    const r = analyzeIBeam(b, h, tf, tw, 100, 200);
    const hw = h - 2 * tf;
    const expected = (b * h ** 3 - (b - tw) * hw ** 3) / 12;
    expect(r.I).toBeCloseTo(expected, -3);
  });

  test('I-Beam: error if h ≤ 2tf', () => {
    let threw = false;
    try { analyzeIBeam(200, 30, 20, 12, 50, 100); } catch { threw = true; }
    expect(threw).toBe(true);
  });

  test('I-Beam: error if b ≤ tw', () => {
    let threw = false;
    try { analyzeIBeam(10, 300, 20, 12, 50, 100); } catch { threw = true; }
    expect(threw).toBe(true);
  });
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Total: ${passed + failed}  ✅ Passed: ${passed}  ❌ Failed: ${failed}`);
if (failed === 0) console.log('🎉 All tests passed!');
