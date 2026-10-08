import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';
import { SpriteRenderer } from '../systems/SpriteRenderer.js';

/**
 * 各波段敵人精靈幀配置
 */
const ENEMY_SPRITE_CONFIGS = {
  mon1: {
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
    scale: 1.1
  },
  mon2: {
    move: [
      { sx: 20, sy: 80, sw: 24, sh: 45 },
      { sx: 84, sy: 80, sw: 24, sh: 45 },
      { sx: 148, sy: 80, sw: 24, sh: 45 },
      { sx: 212, sy: 80, sw: 24, sh: 45 }
    ],
    hurt: [
      { sx: 80, sy: 210, sw: 30, sh: 48 },
      { sx: 144, sy: 210, sw: 30, sh: 48 }
    ],
    scale: 1.1
  },
  mon3: {
    move: [
      { sx: 15, sy: 20, sw: 35, sh: 35 },
      { sx: 75, sy: 20, sw: 35, sh: 35 },
      { sx: 135, sy: 20, sw: 38, sh: 35 },
      { sx: 195, sy: 20, sw: 38, sh: 35 },
      { sx: 260, sy: 20, sw: 35, sh: 35 }
    ],
    hurt: [
      { sx: 70, sy: 140, sw: 40, sh: 38 },
      { sx: 135, sy: 140, sw: 40, sh: 38 }
    ],
    scale: 1.15
  },
  skull: {
    move: [
      { sx: 0, sy: 0, sw: 64, sh: 64 },
      { sx: 64, sy: 0, sw: 64, sh: 64 }
    ],
    hurt: [
      { sx: 128, sy: 0, sw: 64, sh: 64 }
    ],
    scale: 0.7
  },
  spiky: {
    move: [
      { sx: 0, sy: 0, sw: 64, sh: 64 },
      { sx: 64, sy: 0, sw: 64, sh: 64 }
    ],
    hurt: [
      { sx: 0, sy: 0, sw: 64, sh: 64 }
    ],
    scale: 0.7
  },
  goblin: {
    move: [
      { sx: 0, sy: 0, sw: 32, sh: 32 },
      { sx: 32, sy: 0, sw: 32, sh: 32 },
      { sx: 0, sy: 32, sw: 32, sh: 32 },
      { sx: 32, sy: 32, sw: 32, sh: 32 }
    ],
    hurt: [
      { sx: 0, sy: 64, sw: 32, sh: 32 },
      { sx: 32, sy: 64, sw: 32, sh: 32 }
    ],
    scale: 1.15
  }
};

/**
 * 敵方實體 (Enemy Entity)
 * 依據波次輪替品種（每 3 波變換）、路徑巡航、血量計算、方向鏡像反轉
 */
export class Enemy extends Entity {
  constructor(path, wave = 1) {
    super(path[0].x, path[0].y);

    // 決定敵人品種
    const typeConfig = CONFIG.ENEMY_TYPES.find(t => wave >= t.minWave && wave <= t.maxWave) || CONFIG.ENEMY_TYPES[CONFIG.ENEMY_TYPES.length - 1];
    this.typeId = typeConfig.id;
    this.assetKey = typeConfig.assetKey;

    const baseHp = CONFIG.ENEMY.getBaseHp(wave) * (typeConfig.hpMul || 1.0);
    this.hp = baseHp;
    this.maxHp = baseHp;
    this.speed = CONFIG.ENEMY.getSpeed(wave) * (typeConfig.speedMul || 1.0);
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

  update(dt, path, onReachEnd) {
    if (this.dead) return;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        this.state = 'move';
      }
    }

    this.frameTimer += dt;
    const spriteCfg = ENEMY_SPRITE_CONFIGS[this.typeId] || ENEMY_SPRITE_CONFIGS.mon1;
    const currentAnim = spriteCfg[this.state] || spriteCfg.move;
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

    // 水平移動方向鏡像反轉
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

  takeDamage(amount) {
    this.hp -= amount;
    this.state = 'hurt';
    this.hurtTimer = 0.18;
    this.frameIndex = 0;
    return this.hp;
  }

  render(ctx, spriteImage = null, now = 0) {
    if (this.dead) return;

    if (spriteImage) {
      const spriteCfg = ENEMY_SPRITE_CONFIGS[this.typeId] || ENEMY_SPRITE_CONFIGS.mon1;
      const currentAnim = spriteCfg[this.state] || spriteCfg.move;
      const frame = currentAnim[this.frameIndex % currentAnim.length];
      const scale = spriteCfg.scale || 1.0;

      // 幽靈怪飄動特效
      const floatY = (this.typeId === 'mon2' || this.typeId === 'skull') ? Math.sin(now / 150 + this.phase) * 3 : 0;

      SpriteRenderer.drawFrame(ctx, spriteImage, frame, this.x, this.y + floatY, {
        flipX: this.facingLeft,
        scale
      });
    } else {
      const r = 12;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f56565';
      ctx.fill();
      ctx.restore();
    }

    // 血條
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
