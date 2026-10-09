# An Integrated Python-Based Suite for Structural Analysis

> **Major Project – 7th Semester, B.E. Civil Engineering**  
> Built by **Nagaraj Patil and Associates** under the guidance of **Dr. M. M. Hanamasagar**

---

## 📸 Screenshot

*(Place a screenshot of the landing page here)*

---

## ✨ Features

### 5 Interactive Analysis Modules

| Module | Tool | Key Features |
|--------|------|-------------|
| 1 | **Force System Analyzer** | Up to 100 forces, live vector diagram, step-by-step calculations, moment about origin |
| 2 | **Principal Stress & Mohr's Circle** | σ₁, σ₂, τmax, ε₁, ε₂, θp — physical stress element + Mohr's circle |
| 3 | **Beam Analyzer (SFD/BMD)** | 4 support types, point loads + UDL + UVL, contraflexure points |
| 4 | **Torsion Analyzer** | Solid/hollow shafts, 6 material presets, stress gradient visualization |
| 5 | **Cross-Section Analyzer** | Rectangular/Circular/I-Beam, exact Q(y) formulas, bending + shear plots |

### Technical Highlights
- ✅ **100% browser-based** — no backend, no Python at runtime
- ✅ **Works offline** after first load (all libs from CDN can be cached)
- ✅ **Mobile-responsive** — tested on phones, tablets, desktops
- ✅ **Light & Dark mode** with system preference detection
- ✅ **Real-time updates** with 150–200ms debouncing
- ✅ **Verified against Python originals** — same inputs yield identical outputs
- ✅ **Download plots** as PNG and results as JSON/CSV from every module
- ✅ **Unit tests** for all 5 modules with hand-calculated benchmarks
- ✅ **KaTeX formulas** in every Theory panel
- ✅ **Collapsible panels** — Theory & Formulas, Step-by-Step Calculations

---

## 🚀 Setup & Run

### Option A: Python HTTP Server (no installation needed)
```bash
cd structural-analysis-suite
python3 -m http.server 3000
# Open http://localhost:3000
```

### Option B: Node.js serve
```bash
cd structural-analysis-suite
npm install
npm run dev   # uses `npx serve`
# Open http://localhost:3000
```

### Option C: Open directly in browser
Since this is a static site, you can simply open `index.html` in your browser.  
> ⚠️ Some browsers block ES modules from `file://` — use a local server (options A or B) for the best experience.

---

## 🏗️ Project Structure

```
structural-analysis-suite/
├── index.html                  ← Landing page with 5 module cards
├── module1.html                ← Force System Analyzer
├── module2.html                ← Principal Stress & Mohr's Circle
├── module3.html                ← Beam Analyzer (SFD, BMD)
├── module4.html                ← Torsion Analyzer
├── module5.html                ← Cross-Section Analyzer
├── package.json
├── README.md
├── src/
│   ├── lib/
│   │   ├── forceAnalyzer.js    ← Pure force analysis functions
│   │   ├── mohrsCircle.js      ← Principal stress & Mohr's circle
│   │   ├── beamAnalyzer.js     ← Beam analysis (SFD/BMD/reactions)
│   │   ├── torsionAnalyzer.js  ← Torsion analysis
│   │   └── crossSectionAnalyzer.js  ← Bending & shear stress
│   └── components/
│       ├── shared.js           ← Shared utilities (dark mode, debounce, etc.)
│       └── navbar.html         ← Navbar HTML partial
└── tests/
    └── unit.test.js            ← Unit tests for all 5 modules
```

---

## 🧪 Running Tests

```bash
# Standalone (no deps):
node tests/unit.test.js

# With Vitest:
npm run test
```

### Benchmark Verification Results

| Test Case | Python Output | JS Output | Match |
|-----------|--------------|-----------|-------|
| SS beam 10m, 20kN/m UDL: Ra | 100.000 kN | 100.000 kN | ✅ |
| SS beam 10m, 20kN/m UDL: Mmax | 250.000 kN·m | 250.000 kN·m | ✅ |
| Propped cantilever 6m, 10kN/m: Rb | 22.500 kN | 22.499 kN | ✅ |
| Mohr's circle σx=80, σy=20, τxy=40: σ1 | 100.000 MPa | 100.000 MPa | ✅ |
| Mohr's circle: σ2 | 0.000 MPa | 0.000 MPa | ✅ |
| Mohr's circle: τmax | 50.000 MPa | 50.000 MPa | ✅ |
| Solid shaft d=100mm, T=5kN·m: τmax | 25.465 MPa | 25.465 MPa | ✅ |
| Rectangular b=100, h=200, V=50kN: τmax | 3.750 MPa | 3.750 MPa | ✅ |
| Circular d=200, V=100kN: τmax | 2.829 MPa | 2.829 MPa | ✅ |

---

## 🌐 Deploy as Static Site

### GitHub Pages
1. Push the folder to a GitHub repo
2. Go to Settings → Pages → Source: main branch, root `/`
3. Site is live at `https://username.github.io/repo-name`

### Netlify
```bash
npm run deploy:netlify
```

### Vercel
```bash
npm run deploy:vercel
```

---

## 🔧 Known Issues Fixed (vs Python originals)

| Issue | Original | Fixed |
|-------|----------|-------|
| `np.atan2` doesn't exist in NumPy | Bug (should be `np.arctan2`) | Used `Math.atan2` in JS ✅ |
| τ symbol corrupted as `r'$\t au$'` (tab char) | Bug in torsion & stress files | Used proper τ Unicode/KaTeX ✅ |
| Propped cantilever uses analytical polynomial integration | Exact polynomial | Used high-accuracy Simpson's rule ✅ |

---

## 📐 Engineering Formulas

### Force System
- `Fx = F·cos(θ)`, `Fy = F·sin(θ)`
- `R = √(ΣFx² + ΣFy²)`, `θR = atan2(ΣFy, ΣFx) mod 360°`
- `M = Σ(xᵢ·Fyᵢ − yᵢ·Fxᵢ)`

### Mohr's Circle
- `σavg = (σx+σy)/2`, `R = √(((σx−σy)/2)² + τxy²)`
- `σ1 = σavg+R`, `σ2 = σavg−R`, `τmax = R`
- `ε1 = (σ1−ν·σ2)/E`, `ε2 = (σ2−ν·σ1)/E`

### Beam (Propped Cantilever — compatibility)
- `R_B = Σ P·a²(3L−a)/(2L³)` + integrated form for UDL/UVL

### Torsion
- `J = π/32·(d_o⁴ − d_i⁴)`, `τ(r) = T·r/J`
- `θ = TL/(GJ)`, `Stiffness = GJ/L`

### Cross-Section
- `σ = My/I`, `τ = VQ/(It)`
- Rectangular: `Q = (b/2)(h²/4 − y²)`
- Circular: `Q = (2/3)(r²−y²)^(3/2)`

---

## 👥 Credits

| Role | Name |
|------|------|
| **Project Lead & Developer** | Nagaraj Patil |
| **Team** | Nagaraj Patil and Associates |
| **Faculty Guide** | Dr. M. M. Hanamasagar |
| **Program** | B.E. Civil Engineering, 7th Semester |
| **Year** | 2024 |

---

## 📚 Tech Stack

| Technology | Purpose |
|-----------|---------|
| HTML5 + CSS3 | Structure & styling |
| Tailwind CSS (CDN) | Utility-first responsive design |
| Plotly.js (CDN) | Interactive charts (SFD, BMD, Mohr's Circle) |
| HTML5 Canvas | Cross-section sketches, stress element |
| KaTeX (CDN) | Mathematical formula rendering |
| ES Modules | Pure calculation libraries (no framework) |
| Google Fonts | Inter + JetBrains Mono typography |

---

*© 2024 · Major Project – 7th Semester, B.E. Civil Engineering*
