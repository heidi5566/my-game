import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';
import { SpriteRenderer } from '../systems/SpriteRenderer.js';

/**
 * 敵方怪物精靈幀定義 (Enemy Sprite Frames - mon1_sprite_addon_2012_12_14.png / enemy.png)
 */
const ENEMY_FRAMES = {
  idle: [
    { sx: 19, sy: 20, sw: 23, sh: 40 },
    { sx: 83, sy: 20, sw: 23, sh: 40 },
    { sx: 148, sy: 20, sw: 23, sh: 40 },
    { sx: 212, sy: 20, sw: 23, sh: 40 }
  ],
  move: [
    { sx: 19, sy: 80, sw: 23, sh: 45 },
    { sx: 85, sy: 80, sw: 23, sh: 45 },
    { sx: 148, sy: 80, sw: 25, sh: 45 },
    { sx: 212, sy: 80, sw: 26, sh: 45 },
    { sx: 276, sy: 80, sw: 25, sh: 45 }
  ],
  hurt: [
    { sx: 81, sy: 205, sw: 30, sh: 50 },
    { sx: 143, sy: 205, sw: 28, sh: 50 }
  ],
  dead: [
    { sx: 19, sy: 205, sw: 23, sh: 50 },
    { sx: 81, sy: 205, sw: 30, sh: 50 },
    { sx: 143, sy: 205, sw: 28, sh: 50 },
    { sx: 206, sy: 205, sw: 32, sh: 50 },
    { sx: 271, sy: 205, sw: 31, sh: 50 },
    { sx: 343, sy: 205, sw: 16, sh: 50 }
  ]
};

/**
 * 敵方實體 (Enemy Entity)
 * 繼承自 Entity，管理巡航路徑、血量、碰撞判定，
 * 並透過 drawImage() 播放行走、受擊多幀動畫與方向反轉
 */
export class Enemy extends Entity {
  constructor(path, wave = 1) {
    super(path[0].x, path[0].y);
    const baseHp = CONFIG.ENEMY.getBaseHp(wave);
    this.hp = baseHp;
    this.maxHp = baseHp;
    this.speed = CONFIG.ENEMY.getSpeed(wave);
    this.reward = CONFIG.ENEMY.getReward(wave);
    this.phase = Math.random() * Math.PI * 2;
    this.seg = 0;

    // 動畫與翻轉控制
    this.state = 'move';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 0.12;
    this.facingLeft = false;
    this.hurtTimer = 0;
  }

  /**
   * 沿折線路徑更新移動與轉向判定
   */
  update(dt, path, onReachEnd) {
    if (this.dead) return;

    // 更新受擊狀態
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        this.state = 'move';
      }
    }

    // 更新動畫幀
    this.frameTimer += dt;
    const currentAnim = ENEMY_FRAMES[this.state] || ENEMY_FRAMES.move;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % currentAnim.length;
    }

    const target = path[this.seg + 1];
    if (!target) {
      this.dead = true;
      if (onReachEnd) {
        onReachEnd(this);
      }
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;

    // 依據 X 移動方向自動反轉鏡像 (Mirror Flip)
    if (dx < -0.5) {
      this.facingLeft = true;
    } else if (dx > 0.5) {
      this.facingLeft = false;
    }

    if (step >= dist) {
      this.x = target.x;
      this.y = target.y;
      this.seg += 1;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  /**
   * 承受子彈傷害
   */
  takeDamage(amount) {
    this.hp -= amount;
    this.state = 'hurt';
    this.hurtTimer = 0.18;
    this.frameIndex = 0;
    return this.hp;
  }

  /**
   * 繪製敵人精靈與血條
   */
  render(ctx, spriteImage = null, now = 0) {
    if (this.dead) return;

    // 1. 精靈圖切割繪製 (drawImage Slicing & Mirroring)
    if (spriteImage) {
      const currentAnim = ENEMY_FRAMES[this.state] || ENEMY_FRAMES.move;
      const frame = currentAnim[this.frameIndex % currentAnim.length];
      SpriteRenderer.drawFrame(ctx, spriteImage, frame, this.x, this.y, {
        flipX: this.facingLeft,
        scale: 1.1
      });
    } else {
      // 容錯備用幾何繪圖
      const r = 12;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f56565';
      ctx.fill();
      ctx.restore();
    }

    // 2. 血條與外框
    const w = 28;
    const h = 4;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const barX = this.x - w / 2;
    const barY = this.y - 24;

    ctx.save();
    ctx.fillStyle = 'rgba(20, 20, 25, 0.7)';
    ctx.fillRect(barX - 1, barY - 1, w + 2, h + 2);

    ctx.fillStyle = '#4a151b';
    ctx.fillRect(barX, barY, w, h);

    ctx.fillStyle = hpRatio > 0.5 ? '#48bb78' : hpRatio > 0.25 ? '#ecc94b' : '#f56565';
    ctx.fillRect(barX, barY, w * hpRatio, h);
    ctx.restore();
  }
}
