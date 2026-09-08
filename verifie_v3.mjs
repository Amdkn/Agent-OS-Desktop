/**
 * Verification for the V3 brief: wallpaper, desktop icons, full-edge resize.
 *
 * Drive the running app at http://localhost:5555 via Playwright (installed
 * under ~/gauntlet-eyes). Capture a screenshot at every proof point, then
 * write a short summary to stdout. The brief asks for visual evidence, so
 * the script names the screenshots and writes them under SORTIE.
 *
 * Selector note (from the previous verifier's comment): the dock isn't a
 * <button>-bearing footer, it's a <div> of buttons. We drive buttons by
 * their visible title, just like the original.
 */

import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const mod = await import(
  pathToFileURL(
    path.join(homedir(), 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
  ).href,
);
const chromium = mod.chromium ?? mod.default?.chromium;

const URL_APP = 'http://localhost:5555';
const SORTIE = '/mnt/c/Users/amado/ASpace_OS_V3/30_Business_OS/09_Blueprints/agentic-os/verif-v3';
fs.mkdirSync(SORTIE, { recursive: true });

const verdicts = [];
const erreurs = [];
const dire = (n, ok, d = '') => verdicts.push(`${ok ? 'OK   ' : 'ECHEC'}  ${n}${d ? ' — ' + d : ''}`);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
p.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(m.text());
});
p.on('pageerror', (e) => erreurs.push(String(e)));

// Reset persistence so the run is repeatable.
await p.goto(URL_APP, { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.removeItem('agent-os.session.v1'));
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1500);

/* ---------------- helpers ---------------- */

const dock = (nom) => p.locator(`button[title]:has-text("${nom}")`).first();
const desktopIcon = (appId) => p.locator(`[data-desktop-icon="${appId}"]`).first();

const getIconPos = (appId) =>
  p.evaluate((id) => {
    const el = document.querySelector(`[data-desktop-icon="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }, appId);

const getWindowBox = () =>
  p.evaluate(() => {
    const el = document.querySelector('div.window-chrome');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });

const closeAllWindows = async () => {
  await p.evaluate(() => {
    document.querySelectorAll('div.window-chrome').forEach((el) => {
      el.querySelectorAll('button[aria-label="fermer"]').forEach((l) => l.click());
    });
  });
  await p.waitForTimeout(300);
};

const dragMouse = async (fromX, fromY, toX, toY, steps = 12) => {
  await p.mouse.move(fromX, fromY);
  await p.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const x = fromX + ((toX - fromX) * i) / steps;
    const y = fromY + ((toY - fromY) * i) / steps;
    await p.mouse.move(x, y, { steps: 2 });
    await p.waitForTimeout(15);
  }
  await p.mouse.up();
  await p.waitForTimeout(200);
};

/* ---------------- 1. wallpaper ---------------- */

const wallpaperCheck = await p.evaluate(() => {
  const divs = [...document.querySelectorAll('div')];
  const withImg = divs.filter((d) => {
    const bg = getComputedStyle(d).backgroundImage;
    return bg && bg.includes('url(') && !bg.includes('gradient');
  });
  if (withImg.length === 0) return { ok: false, reason: 'aucun div avec background-image url()' };
  const el = withImg[0];
  const cs = getComputedStyle(el);
  return {
    ok: true,
    backgroundImage: cs.backgroundImage,
    backgroundSize: cs.backgroundSize,
    backgroundPosition: cs.backgroundPosition,
  };
});
dire(
  'fond affiche',
  wallpaperCheck.ok,
  JSON.stringify(wallpaperCheck).slice(0, 200),
);
await p.screenshot({ path: `${SORTIE}/01-wallpaper.png`, fullPage: false });

const dockLabelBg = await p.evaluate(() => {
  const b = document.querySelector('button[title]');
  if (!b) return null;
  const cs = getComputedStyle(b);
  return { color: cs.color, opacity: cs.opacity };
});
dire(
  'texte non transparent',
  dockLabelBg && dockLabelBg.opacity !== '0',
  JSON.stringify(dockLabelBg ?? 'null'),
);

/* ---------------- 2. desktop icons ---------------- */

const iconCount = await p.locator('[data-desktop-icon]').count();
dire('icones de bureau presentes', iconCount >= 3, `${iconCount} icones`);

const beforeDrag = await getIconPos('observers');
dire('icone observers trouvee', beforeDrag !== null, JSON.stringify(beforeDrag));

// Single click selects.
await desktopIcon('observers').click();
await p.waitForTimeout(200);
const selectedColor = await p.evaluate(() => {
  const el = document.querySelector('[data-desktop-icon="observers"] > div');
  return el ? getComputedStyle(el).backgroundColor : null;
});
dire(
  'clic selectionne (fond colore)',
  !!selectedColor && selectedColor.includes('108, 240, 194'),
  selectedColor ?? 'null',
);
await p.screenshot({ path: `${SORTIE}/02-icon-selected.png`, fullPage: false });

// Double click opens.
const winBefore = await p.locator('div.window-chrome').count();
await desktopIcon('observers').dblclick();
await p.waitForTimeout(700);
const winAfter = await p.locator('div.window-chrome').count();
dire(
  'double-clic ouvre la fenetre',
  winAfter > winBefore,
  `${winBefore} -> ${winAfter} fenetres`,
);
await p.screenshot({ path: `${SORTIE}/03-icon-double-click.png`, fullPage: false });

/* ---------------- 3. icon drag persists ---------------- */

await closeAllWindows();

const startIcon = await getIconPos('memories');
const targetLeft = 240;
const targetTop = 160;
let movedPos = null;
if (startIcon) {
  const fromX = startIcon.left + startIcon.width / 2;
  const fromY = startIcon.top + startIcon.height / 2;
  // The cursor moves by a known delta; the icon's top-left should move by
  // exactly that same delta, since we drag from the cursor's center of the
  // icon (see implementation: absolute position = startPos + cursorDelta).
  const dx = 100;
  const dy = 80;
  await dragMouse(fromX, fromY, fromX + dx, fromY + dy);
  movedPos = await getIconPos('memories');
}
const expectedLeft = startIcon ? startIcon.left + 100 : 0;
const expectedTop = startIcon ? startIcon.top + 80 : 0;
const movedEnough =
  movedPos &&
  Math.abs(movedPos.left - expectedLeft) < 5 &&
  Math.abs(movedPos.top - expectedTop) < 5;
dire(
  'icone deplacee',
  movedEnough,
  JSON.stringify({ from: startIcon, to: movedPos, expected: { left: expectedLeft, top: expectedTop } }),
);
await p.screenshot({ path: `${SORTIE}/04-icon-moved.png`, fullPage: false });

await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const restoredPos = await getIconPos('memories');
const persisted =
  restoredPos &&
  Math.abs(restoredPos.left - expectedLeft) < 5 &&
  Math.abs(restoredPos.top - expectedTop) < 5;
dire(
  'position de licone persiste apres reload',
  persisted,
  JSON.stringify(restoredPos),
);
await p.screenshot({ path: `${SORTIE}/05-icon-after-reload.png`, fullPage: false });

/* ---------------- 4. window resize by edge AND by corner ---------------- */

await dock('moires').click().catch(async () => {
  await dock('Memoires').click();
});
await p.waitForTimeout(700);

// Helper: pick the lateral handle on the requested side. The east handle
// is the one whose center sits on the right edge of the window.
const pickEdgeHandle = (side) =>
  p.evaluate((which) => {
    const el = document.querySelector('div.window-chrome');
    if (!el) return null;
    const er = el.getBoundingClientRect();
    const handles = [...el.querySelectorAll('div')].filter((d) =>
      getComputedStyle(d).cursor === 'ew-resize',
    );
    const wanted = handles.find((h) => {
      const r = h.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      return which === 'east' ? cx > er.left + er.width / 2 : cx < er.left + er.width / 2;
    });
    if (!wanted) return null;
    const r = wanted.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, side);

const pickCornerHandle = () =>
  p.evaluate(() => {
    const el = document.querySelector('div.window-chrome');
    if (!el) return null;
    const er = el.getBoundingClientRect();
    const handles = [...el.querySelectorAll('div')].filter((d) =>
      getComputedStyle(d).cursor === 'nwse-resize',
    );
    // Bottom-right corner: cursor = 'nwse-resize', and its midpoint is in
    // the lower-right quadrant of the window.
    const se = handles.find((h) => {
      const r = h.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return cx > er.left + er.width / 2 && cy > er.top + er.height / 2;
    });
    if (!se) return null;
    const r = se.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

const beforeResize = await getWindowBox();

// Resize by the EAST edge (right side) — drag the right handle 180px right.
const eastHandle = await pickEdgeHandle('east');
if (eastHandle) await dragMouse(eastHandle.x, eastHandle.y, eastHandle.x + 180, eastHandle.y);
const afterEdgeResize = await getWindowBox();
const edgeDelta =
  afterEdgeResize && beforeResize ? afterEdgeResize.width - beforeResize.width : 0;
dire(
  'redimensionnement par le bord est',
  Math.abs(edgeDelta - 180) < 30,
  `${edgeDelta >= 0 ? '+' : ''}${edgeDelta.toFixed(0)}px`,
);
await p.screenshot({ path: `${SORTIE}/06-resized-edge.png`, fullPage: false });

// Resize via the SOUTH-EAST corner.
const seHandle = await pickCornerHandle();
if (seHandle) await dragMouse(seHandle.x, seHandle.y, seHandle.x + 140, seHandle.y + 90);
const afterCornerResize = await getWindowBox();
const cornerDeltaW =
  afterCornerResize && afterEdgeResize
    ? afterCornerResize.width - afterEdgeResize.width
    : 0;
const cornerDeltaH =
  afterCornerResize && afterEdgeResize
    ? afterCornerResize.height - afterEdgeResize.height
    : 0;
dire(
  'redimensionnement par le coin sud-est',
  Math.abs(cornerDeltaW - 140) < 30 && Math.abs(cornerDeltaH - 90) < 30,
  `+${cornerDeltaW.toFixed(0)}px x +${cornerDeltaH.toFixed(0)}px`,
);
await p.screenshot({ path: `${SORTIE}/07-resized-corner.png`, fullPage: false });

// Reload — the resized dimensions should survive.
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const afterReload = await p.evaluate(() => {
  const el = document.querySelector('div.window-chrome');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { width: r.width, height: r.height };
});
const reloadWidthOk =
  afterReload &&
  afterCornerResize &&
  Math.abs(afterReload.width - afterCornerResize.width) < 5 &&
  Math.abs(afterReload.height - afterCornerResize.height) < 5;
dire(
  'taille de la fenetre preservee apres reload',
  reloadWidthOk,
  `${afterReload ? `${afterReload.width.toFixed(0)}x${afterReload.height.toFixed(0)}` : 'null'}`,
);
await p.screenshot({ path: `${SORTIE}/08-window-after-reload.png`, fullPage: false });

await b.close();

console.log(verdicts.join('\n'));
console.log('\nERREURS CONSOLE : ' + (erreurs.length || 'aucune'));
for (const e of erreurs.slice(0, 5)) console.log('  ' + e);
