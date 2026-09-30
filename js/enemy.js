// 敵人/障礙物模組：生成、路徑移動與繪圖

import { PATH } from './config.js';

/**
 * 建立一個新敵人物件
 * @param {number} wave 目前波次
 * @param {Array} pathPoints 移動路徑
 * @returns {Object} 敵人實例
 */
export function createEnemy(wave, pathPoints = PATH) {
  const baseHp = 30 + (wave - 1) * 12;
  return {
    x: pathPoints[0].x,
    y: pathPoints[0].y,
    hp: baseHp,
    maxHp: baseHp,
    speed: 45 + (wave - 1) * 3,
    seg: 0,
    reward: 5 + Math.floor(wave / 2),
    phase: Math.random() * Math.PI * 2,
    dead: false
  };
}

/**
 * 移動單個敵人
 * @param {Object} e 敵人
 * @param {number} dt 時間增量(秒)
 * @param {Array} pathPoints 移動路徑
 * @param {Function} onReachEnd 敵人抵達路徑終點的回呼函式
 */
export function moveEnemy(e, dt, pathPoints = PATH, onReachEnd) {
  const target = pathPoints[e.seg + 1];
  if (!target) {
    e.dead = true;
    if (onReachEnd) onReachEnd(e);
    return;
  }

  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const dist = Math.hypot(dx, dy);
  const step = e.speed * dt;

  if (step >= dist) {
    e.x = target.x;
    e.y = target.y;
    e.seg += 1;
  } else {
    e.x += (dx / dist) * step;
    e.y += (dy / dist) * step;
  }
}

/**
 * 繪製所有敵人（炸彈兵外觀、引信、火花與血條）
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} enemies 敵人陣列
 * @param {number} now 當前時間戳
 */
export function drawEnemies(ctx, enemies, now) {
  for (const e of enemies) {
    if (e.dead) continue;
    const r = 12;
    ctx.save();
    ctx.translate(e.x, e.y);

    // 炸彈本體
    const bodyGrad = ctx.createRadialGradient(-4, -4, 1, 0, 0, r);
    bodyGrad.addColorStop(0, '#5a5a5a');
    bodyGrad.addColorStop(0.6, '#2b2b2b');
    bodyGrad.addColorStop(1, '#131313');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 高光
    ctx.beginPath();
    ctx.arc(-4, -4, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    // 引信
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(4, -r - 8, 2, -r - 12);
    ctx.stroke();

    // 火花（閃爍效果）
    const flick = 0.6 + 0.4 * Math.sin(now / 70 + e.phase * 10);
    ctx.beginPath();
    ctx.arc(2, -r - 12, 2.5 * flick + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = flick > 0.8 ? '#fff6c8' : '#f6ad55';
    ctx.fill();

    ctx.restore();

    // 敵方血條
    const w = 26;
    ctx.fillStyle = '#33161a';
    ctx.fillRect(e.x - w / 2, e.y - r - 22, w, 4);
    ctx.fillStyle = '#68d391';
    ctx.fillRect(e.x - w / 2, e.y - r - 22, w * (e.hp / e.maxHp), 4);
  }
}
