// 玩家與防禦塔模組：砲塔系統、砲彈、粒子特效、音效管理與放置預覽

import {
  distToPath,
  normalizeAngle,
  pointDist,
  hexPath,
  hexPathAt,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PATH_CLEARANCE,
  NEW_TOWER_MIN_GAP
} from './config.js';

// ================= 音效系統 (Web Audio API) =================
let audioCtx = null;
let soundOn = true;

export function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function isSoundOn() {
  return soundOn;
}

export function toggleSound() {
  soundOn = !soundOn;
  if (soundOn) ensureAudio();
  return soundOn;
}

export function playShoot() {
  if (!soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(920, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.06);
  g.gain.setValueAtTime(0.04, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 0.08);
}

export function playExplosion() {
  if (!soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  const dur = 0.35;
  const bufferSize = Math.floor(audioCtx.sampleRate * dur);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + dur);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

export function playPlace() {
  if (!soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(300, audioCtx.currentTime);
  o.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.15);
  g.gain.setValueAtTime(0.08, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 0.18);
}

// ================= 砲塔管理 =================
export function makeTower(x, y) {
  return {
    x,
    y,
    range: 130,
    damage: 12,
    fireRate: 550,
    lastShot: 0,
    level: 1,
    angle: -Math.PI / 2
  };
}

export function isValidPlacement(x, y, towers, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
  if (x < 26 || x > width - 26 || y < 26 || y > height - 26) return false;
  if (distToPath(x, y) < PATH_CLEARANCE) return false;
  for (const t of towers) {
    if (pointDist(x, y, t.x, t.y) < NEW_TOWER_MIN_GAP) return false;
  }
  return true;
}

export function updateTowers(towers, enemies, dt, now, onFireBullet) {
  for (const t of towers) {
    let best = null;
    let bestSeg = -1;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = pointDist(e.x, e.y, t.x, t.y);
      if (d <= t.range && e.seg > bestSeg) {
        bestSeg = e.seg;
        best = e;
      }
    }
    if (best) {
      const desired = Math.atan2(best.y - t.y, best.x - t.x);
      t.angle += normalizeAngle(desired - t.angle) * Math.min(1, dt * 8);
      if (now - t.lastShot >= t.fireRate) {
        t.lastShot = now;
        if (onFireBullet) onFireBullet(t, best, t.damage);
      }
    } else {
      t.angle += dt * 0.4; // 待機掃視
    }
  }
}

export function drawLevelBadge(ctx, cx, topY, level, highlight) {
  ctx.font = 'bold 11px sans-serif';
  const text = 'Lv ' + level;
  const tw = ctx.measureText(text).width;
  const pad = 6;
  const bw = tw + pad * 2;
  const bh = 16;
  const bx = cx - bw / 2;
  const by = topY - bh;
  ctx.beginPath();
  const r = 4;
  ctx.moveTo(bx + r, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
  ctx.arcTo(bx, by + bh, bx, by, r);
  ctx.arcTo(bx, by, bx + bw, by, r);
  ctx.closePath();
  ctx.fillStyle = highlight ? '#f6ad55' : '#20303d';
  ctx.fill();
  ctx.strokeStyle = highlight ? '#f6ad55' : '#4fd1c5';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = highlight ? '#1a1206' : '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, by + bh / 2 + 0.5);
}

export function drawTowers(ctx, towers, selectedTower) {
  for (const t of towers) {
    const baseR = 19 + t.level * 1.8;
    const turretR = 9 + t.level * 1.3;
    const barrelLen = 20 + t.level * 2.2;
    const isSel = (t === selectedTower);

    // 射程範圍
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79, 209, 197, 0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.25)';
    ctx.stroke();

    ctx.save();
    ctx.translate(t.x, t.y);

    // 選中光環
    if (isSel) {
      ctx.beginPath();
      ctx.arc(0, 0, baseR + 7, 0, Math.PI * 2);
      ctx.strokeStyle = '#f6ad55';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // 塔座 (六角形底座)
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, baseR);
    grad.addColorStop(0, '#3a4f5e');
    grad.addColorStop(1, '#1c2833');
    hexPath(ctx, baseR);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#0f1720';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 砲管 (依角度旋轉指向目標)
    ctx.save();
    ctx.rotate(t.angle);
    ctx.fillStyle = '#0f1720';
    ctx.fillRect(0, -4, barrelLen, 8);
    ctx.fillStyle = '#334a5a';
    ctx.fillRect(0, -2, barrelLen, 4);
    ctx.restore();

    // 砲塔頂部圓盤
    const turretGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, turretR);
    turretGrad.addColorStop(0, '#8fe9df');
    turretGrad.addColorStop(1, '#2a9d93');
    ctx.beginPath();
    ctx.arc(0, 0, turretR, 0, Math.PI * 2);
    ctx.fillStyle = turretGrad;
    ctx.fill();
    ctx.strokeStyle = '#12332f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // 等級標籤 (置於塔上方)
    drawLevelBadge(ctx, t.x, t.y - baseR - 6, t.level, isSel);
  }
}

export function drawPlacementPreview(ctx, mx, my, valid) {
  if (mx === null || my === null) return;
  ctx.beginPath();
  hexPathAt(ctx, mx, my, 19);
  ctx.fillStyle = valid ? 'rgba(79,209,197,0.5)' : 'rgba(245,101,101,0.5)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx, my, 130, 0, Math.PI * 2);
  ctx.strokeStyle = valid ? 'rgba(79,209,197,0.4)' : 'rgba(245,101,101,0.4)';
  ctx.stroke();
}

// ================= 砲彈系統 =================
export function fireBullet(bullets, from, target, damage) {
  bullets.push({ x: from.x, y: from.y, target, speed: 340, damage, dead: false });
  playShoot();
}

export function updateBullets(bullets, dt, onHit, onKill) {
  for (const b of bullets) {
    if (b.dead) continue;
    if (!b.target || b.target.dead || b.target.hp <= 0) {
      b.dead = true;
      continue;
    }
    const dx = b.target.x - b.x;
    const dy = b.target.y - b.y;
    const dist = Math.hypot(dx, dy);
    const step = b.speed * dt;
    if (step >= dist) {
      b.target.hp -= b.damage;
      b.dead = true;
      if (b.target.hp > 0) {
        if (onHit) onHit(b.target.x, b.target.y);
      } else if (!b.target.dead) {
        b.target.dead = true;
        if (onKill) onKill(b.target);
      }
    } else {
      b.x += (dx / dist) * step;
      b.y += (dy / dist) * step;
    }
  }
  return bullets.filter(b => !b.dead);
}

export function drawBullets(ctx, bullets) {
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e08e2c';
    ctx.fill();
    ctx.strokeStyle = '#8a5a12';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ================= 粒子特效系統 =================
export function spawnExplosion(particles, x, y) {
  particles.push({ type: 'shock', x, y, life: 0.4, maxLife: 0.4 });
  const n = 12;
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i + Math.random() * 0.3;
    const speed = 70 + Math.random() * 90;
    particles.push({
      type: 'spark',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.45 + Math.random() * 0.15,
      maxLife: 0.6
    });
  }
  playExplosion();
}

export function updateParticles(particles, dt) {
  for (const p of particles) {
    p.life -= dt;
    if (p.type === 'spark') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }
  return particles.filter(p => p.life > 0);
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const t = p.life / p.maxLife;
    if (p.type === 'shock') {
      const radius = (1 - t) * 46 + 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,180,90,${t * 0.8})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (p.type === 'spark') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * t + 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${120 + Math.floor(t * 100)},60,${t})`;
      ctx.fill();
    } else { // 'hit'
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 * t + 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224,142,44,${t})`;
      ctx.fill();
    }
  }
}
