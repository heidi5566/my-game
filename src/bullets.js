/**
 * 獨立子彈與視覺動效模組 (Bullet & Visual Effects System)
 * 
 * 包含：
 * - BulletSystem 物件：提供 fire(playerX, playerY) 與 update(ctx)
 * - 扇形散射機制：連續射擊時呈現多段式/波浪式扇形擴散彈幕
 * - 漂亮霓虹曳尾：多重粒子餘燼、漸層光暈與加法混色 (Additive Blending) 視覺特效
 */

class Bullet {
  constructor({ x, y, vx, vy, speed, angle, color, trailColor, radius = 5, damage = 25 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.speed = speed;
    this.angle = angle;
    this.color = color;
    this.trailColor = trailColor;
    this.radius = radius;
    this.damage = damage;
    this.dead = false;
    this.age = 0;
    this.maxAge = 3.5; // 秒

    // 曳尾軌跡點歷史記錄 (最多保留 16 個座標節點以維持順暢流線感)
    this.history = [];
    this.maxHistory = 16;
  }

  update(dt) {
    if (this.dead) return;

    this.age += dt;
    if (this.age >= this.maxAge) {
      this.dead = true;
      return;
    }

    // 記錄當前位置進入歷史曳尾
    this.history.unshift({ x: this.x, y: this.y, age: 0 });
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // 更新歷史節點壽命
    for (const p of this.history) {
      p.age += dt;
    }

    // 依速度向量位移
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    if (this.dead || this.history.length === 0) return;

    ctx.save();

    // 1. 繪製流光顏色曳尾 (Tapered Glowing Trail)
    if (this.history.length > 1) {
      for (let i = 0; i < this.history.length - 1; i++) {
        const p1 = this.history[i];
        const p2 = this.history[i + 1];
        const progress = 1 - (i / this.history.length); // 1.0 (頭) -> 0.0 (尾)
        const alpha = Math.max(0, progress * 0.85);
        const lineWidth = Math.max(1, this.radius * progress * 1.8);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = this.trailColor.replace('ALPHA', alpha.toFixed(3));
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // 2. 繪製子彈本體外層霓虹光暈 (Glow Halo)
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;

    // 依飛行方向旋轉繪製流線型子彈核
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 2.2, this.radius * 1.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // 3. 高亮子彈中心發光白核 (Bright White Core)
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(this.radius * 0.4, 0, this.radius * 1.2, this.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}

/**
 * 擊中與尾跡散落粒子 (Impact & Spark Particle)
 */
class SparkParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const speed = 40 + Math.random() * 90;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.size = 2 + Math.random() * 2.5;
    this.alpha = 1.0;
    this.decay = 2.0 + Math.random() * 2.5;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.alpha -= this.decay * dt;
    this.size = Math.max(0.5, this.size - dt * 2);
    if (this.alpha <= 0) {
      this.dead = true;
    }
  }

  render(ctx) {
    if (this.dead) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * BulletSystem 核心類別
 */
class BulletSystemCore {
  constructor() {
    this.bullets = [];
    this.sparks = [];
    this.lastUpdateTime = null;

    // 連續射擊扇形散射控制參數
    this.consecutiveShots = 0;
    this.lastFireTime = 0;
    this.comboResetDelay = 650; // 超過 650ms 沒射擊則連擊重置

    // 絢麗霓虹色相調色盤 (粉紅、天藍、紫羅蘭、琥珀橙、碧翡翠)
    this.palette = [
      { color: '#00f3ff', trail: 'rgba(0, 243, 255, ALPHA)' },   // 霓虹青
      { color: '#a855f7', trail: 'rgba(168, 85, 247, ALPHA)' },  // 幻境紫
      { color: '#ec4899', trail: 'rgba(236, 72, 153, ALPHA)' },  // 櫻花粉
      { color: '#f59e0b', trail: 'rgba(245, 158, 11, ALPHA)' },  // 琥珀金
      { color: '#10b981', trail: 'rgba(16, 185, 129, ALPHA)' },  // 碧翡翠
      { color: '#3b82f6', trail: 'rgba(59, 130, 246, ALPHA)' }   // 電光藍
    ];
  }

  /**
   * 發射扇形散射子彈
   * @param {number} playerX 發射點 X 座標 (預設右上方指揮官位置)
   * @param {number} playerY 發射點 Y 座標
   */
  fire(playerX = 610, playerY = 80) {
    const now = performance.now();
    const timeSinceLast = now - this.lastFireTime;

    // 判斷是否為連續射擊
    if (timeSinceLast < this.comboResetDelay) {
      this.consecutiveShots += 1;
    } else {
      this.consecutiveShots = 0;
    }
    this.lastFireTime = now;

    // 連續射擊時呈現階梯擴展的扇形散射 (從 3 發到 5 發、7 發擴散，並動態微調扇形張角)
    const tier = this.consecutiveShots % 4;
    const bulletCounts = [3, 5, 5, 7];
    const spreadAngles = [0.35, 0.52, 0.65, 0.85]; // 弧度 (約 20° ~ 48°)

    const bulletCount = bulletCounts[tier];
    const totalSpread = spreadAngles[tier];

    // 基準朝向：預設從右方射向左方戰場 (Math.PI，指向左偏下中心 180° ~ 195°)
    const targetX = 200;
    const targetY = 220;
    const baseAngle = Math.atan2(targetY - playerY, targetX - playerX);

    const speed = 460;
    const angleStep = bulletCount > 1 ? totalSpread / (bulletCount - 1) : 0;
    const startAngle = baseAngle - totalSpread / 2;

    // 依色相環分佈漂亮的顏色
    const paletteOffset = (this.consecutiveShots * 2) % this.palette.length;

    for (let i = 0; i < bulletCount; i++) {
      const angle = startAngle + i * angleStep;
      const theme = this.palette[(paletteOffset + i) % this.palette.length];
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const bullet = new Bullet({
        x: playerX,
        y: playerY,
        vx,
        vy,
        speed,
        angle,
        color: theme.color,
        trailColor: theme.trail,
        radius: 4.5,
        damage: 28
      });

      this.bullets.push(bullet);

      // 發射點微小火花
      for (let s = 0; s < 2; s++) {
        this.sparks.push(new SparkParticle(playerX, playerY, theme.color));
      }
    }
  }

  /**
   * 遊戲每一幀更新與繪製
   * @param {CanvasRenderingContext2D} ctx 畫布上下文
   */
  update(ctx) {
    if (!ctx || !ctx.canvas) return;

    const now = performance.now();
    const dt = this.lastUpdateTime ? Math.min((now - this.lastUpdateTime) / 1000, 0.1) : 0.016;
    this.lastUpdateTime = now;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // 檢查是否有正在遊玩中的怪物可判定命中 (若掛載於 Game 實例下)
    const enemies = window.game?.gameState === 'PLAYING' ? window.game?.enemies : null;

    // 1. 更新子彈位置與碰撞判定
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt);

      // 檢查邊界 (出界銷毀)
      if (b.x < -40 || b.x > width + 40 || b.y < -40 || b.y > height + 40) {
        b.dead = true;
      }

      // 與場上敵人進行命中判定
      if (!b.dead && enemies && enemies.length > 0) {
        for (const e of enemies) {
          if (!e.dead && e.hp > 0) {
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < (e.radius || 20) + b.radius) {
              b.dead = true;
              e.takeDamage(b.damage);

              // 產生璀璨命中火花
              for (let k = 0; k < 6; k++) {
                this.sparks.push(new SparkParticle(b.x, b.y, b.color));
              }

              // 若擊倒敵人
              if (e.hp <= 0 && !e.dead) {
                e.dead = true;
                if (window.game?.player) {
                  window.game.player.addGold(e.reward || 10);
                  window.game.player.addKill();
                }
                if (window.game?.particleSystem) {
                  window.game.particleSystem.spawnExplosion(e.x, e.y);
                }
              }
              break;
            }
          }
        }
      }

      if (b.dead && b.history.length === 0) {
        this.bullets.splice(i, 1);
      }
    }

    // 2. 更新火花粒子
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.update(dt);
      if (s.dead) {
        this.sparks.splice(i, 1);
      }
    }

    // 3. 渲染子彈與發光效果
    // 啟用加法發光 (Additive Blending) 讓曳尾疊加時綻放強烈流光
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 渲染火花粒子
    for (const s of this.sparks) {
      s.render(ctx);
    }

    // 渲染子彈與流光曳尾
    for (const b of this.bullets) {
      b.render(ctx);
    }

    ctx.restore();
  }

  /**
   * 清空場上所有特效與子彈
   */
  clear() {
    this.bullets = [];
    this.sparks = [];
    this.consecutiveShots = 0;
  }
}

// 建立單例物件提供直接呼叫
const BulletSystem = new BulletSystemCore();

// 支援全域掛載與 ES Module
if (typeof window !== 'undefined') {
  window.BulletSystem = BulletSystem;
}

export default BulletSystem;
export { BulletSystem, BulletSystemCore };
