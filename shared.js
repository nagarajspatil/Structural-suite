/**
 * shared.js — Shared utilities for all module pages:
 *   - Dark mode toggle
 *   - Mobile menu
 *   - Active nav link highlighting
 *   - Debounce helper
 *   - Download helpers (PNG + CSV/JSON)
 *   - Collapsible panel helper
 *   - Toast notifications
 */

// ─── Dark Mode ────────────────────────────────────────────────────────────────
export function initDarkMode() {
  const html = document.documentElement;
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#darkToggle')) {
      html.classList.toggle('dark');
      localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
    }
  });
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────
export function initMobileMenu() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('#mobileMenuBtn');
    if (btn) {
      const menu = document.getElementById('mobileMenu');
      if (menu) menu.classList.toggle('hidden');
    }
  });
}

// ─── Active nav link ─────────────────────────────────────────────────────────
export function highlightActiveNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current) {
      a.classList.add('bg-engineering-50', 'dark:bg-engineering-900/30', 'text-engineering-700', 'dark:text-engineering-400', 'font-semibold');
    }
  });
}

// ─── Debounce ─────────────────────────────────────────────────────────────────
export function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Collapsible panels ───────────────────────────────────────────────────────
export function initCollapsibles() {
  document.querySelectorAll('[data-collapse-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.collapseBtn;
      const panel = document.getElementById(targetId);
      if (!panel) return;
      const isHidden = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !isHidden);
      const chevron = btn.querySelector('.chevron');
      if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
    });
  });
}

// ─── Toast notifications ─────────────────────────────────────────────────────
export function showToast(message, type = 'success', duration = 3000) {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-engineering-600',
  };
  const toast = document.createElement('div');
  toast.className = `fixed bottom-6 right-6 z-50 ${colors[type] || colors.info} text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 transition-all`;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─── Validation helpers ───────────────────────────────────────────────────────
export function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = message
    ? `<div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">${message.replace(/\n/g, '<br/>')}</div>`
    : '';
}

export function clearError(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
}

// ─── Number formatting ────────────────────────────────────────────────────────
export function fmt(n, decimals = 3) {
  if (Math.abs(n) < 1e-10) return '0';
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 0.001 && n !== 0)) return n.toExponential(3);
  return parseFloat(n.toFixed(decimals)).toString();
}

export function fmtSci(n) {
  return n.toExponential(4);
}

// ─── Download helpers ─────────────────────────────────────────────────────────
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

export function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  triggerDownload(blob, filename);
}

export function downloadPlotAsPNG(plotlyDivId, filename) {
  if (window.Plotly) {
    window.Plotly.downloadImage(document.getElementById(plotlyDivId), {
      format: 'png', width: 1200, height: 800, filename: filename || 'plot'
    });
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Shared footer HTML ───────────────────────────────────────────────────────
export function renderFooter() {
  return `
  <footer class="bg-slate-900 dark:bg-slate-950 text-slate-400 py-10 px-4 border-t border-slate-800 mt-12">
    <div class="max-w-5xl mx-auto text-sm text-center space-y-2">
      <p class="text-white font-semibold text-base">An Integrated Python-Based Suite for Structural Analysis</p>
      <p>Built by <strong class="text-white">Nagaraj Patil and Associates</strong> under the guidance of <strong class="text-white">Dr. M. M. Hanamasagar</strong></p>
      <p class="text-slate-500">Major Project – 7th Semester, B.E. Civil Engineering · © 2024</p>
      <div class="flex flex-wrap justify-center gap-4 pt-2">
        <a href="index.html" class="hover:text-engineering-400 transition-colors">Home</a>
        <a href="module1.html" class="hover:text-engineering-400 transition-colors">Force System</a>
        <a href="module2.html" class="hover:text-engineering-400 transition-colors">Mohr's Circle</a>
        <a href="module3.html" class="hover:text-engineering-400 transition-colors">Beam Analyzer</a>
        <a href="module4.html" class="hover:text-engineering-400 transition-colors">Torsion</a>
        <a href="module5.html" class="hover:text-engineering-400 transition-colors">Cross-Section</a>
      </div>
    </div>
  </footer>`;
}

// ─── Init all shared behaviours ───────────────────────────────────────────────
export function initShared() {
  initDarkMode();
  initMobileMenu();
  highlightActiveNav();
  initCollapsibles();
}
