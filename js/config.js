// 遊戲全域設定與幾何工具函數

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 420;

// 凹字型路徑點
export const PATH = [
  { x: -20, y: 60 },
  { x: 150, y: 60 },
  { x: 150, y: 220 },
  { x: 400, y: 220 },
  { x: 400, y: 80 },
  { x: 660, y: 80 }
];

export const PATH_CLEARANCE = 34;
export const MAX_TOWERS = 3;
export const NEW_TOWER_COST = 40;
export const NEW_TOWER_MIN_GAP = 55;
export const TOWER_UPGRADE_COST = 20;

export const INITIAL_GOLD = 50;
export const INITIAL_LIVES = 10;
export const INITIAL_WAVE = 1;

/**
 * 計算點到線段的最短距離
 */
export function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * 計算點到全路徑的最短距離
 */
export function distToPath(px, py, pathSegments = PATH) {
  let min = Infinity;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const d = distToSegment(
      px, py,
      pathSegments[i].x, pathSegments[i].y,
      pathSegments[i + 1].x, pathSegments[i + 1].y
    );
    if (d < min) min = d;
  }
  return min;
}

/**
 * 將角度標準化到 -PI ~ PI 範圍
 */
export function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * 兩點距離公式
 */
export function pointDist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * 在 (0,0) 為中心繪製六角形路徑（需在外層配合 translate）
 */
export function hexPath(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * 在指定座標 (cx, cy) 繪製六角形路徑
 */
export function hexPathAt(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
