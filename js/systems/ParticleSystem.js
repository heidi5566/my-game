import { SpriteRenderer } from './SpriteRenderer.js';

/**
 * 爆炸與受擊精靈圖幀 (Effect Sprite Frames - energy_effect_base.png / effects.png)
 */
const EFFECT_FRAMES = [
  { sx: 0, sy: 0, sw: 32, sh: 32 },
  { sx: 32, sy: 0, sw: 32, sh: 32 },
  { sx: 64, sy: 0, sw: 32, sh: 32 },
  { sx: 96, sy: 0, sw: 32, sh: 32 },
  { sx: 128, sy: 0, sw: 32, sh: 32 }
];

/**
 * 粒子與爆炸特效系統 (Particle & Explosion VFX System)
 * 負責處理精靈圖切分爆炸動畫、震波、飛濺火花與受擊閃爍效果
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * 觸發爆炸效果（精靈動畫 + 衝擊波 + 12 顆隨機火花）
   */
  spawnExplosion(x, y) {
    // 1. 精靈圖爆炸動畫粒子
    this.particles.push({
      type: 'sprite_explosion',
      x,
      y,
      frameIndex: 0,
      timer: 0,
      frameInterval: 0.06,
      life: 0.36,
      maxLife: 0.36
    });

    // 2. 震波光環
    this.particles.push({
      type: 'shock',
      x,
      y,
      life: 0.38,
      maxLife: 0.38
    });

    // 3. 飛濺火花
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = 70 + Math.random() * 90;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.15,
        maxLife: 0.6
      });
    }
  }

  /**
   * 觸發受擊命中粒子
   */
  spawnHit(x, y) {
    this.particles.push({
      type: 'hit',
      x,
      y,
      life: 0.15,
      maxLife: 0.15
    });
  }

  /**
   * 更新所有粒子的生命週期與物理運動
   */
  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      if (p.type === 'spark') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else if (p.type === 'sprite_explosion') {
        p.timer += dt;
        if (p.timer >= p.frameInterval) {
          p.timer = 0;
          p.frameIndex = Math.min(EFFECT_FRAMES.length - 1, p.frameIndex + 1);
        }
      }
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  /**
   * 繪製所有粒子與精靈特效
   */
  render(ctx, effectImage = null) {
    for (const p of this.particles) {
      const t = p.life / p.maxLife;

      if (p.type === 'sprite_explosion' && effectImage) {
        const frame = EFFECT_FRAMES[p.frameIndex];
        SpriteRenderer.drawFrame(ctx, effectImage, frame, p.x, p.y, {
          scale: 1.4,
          alpha: t
        });
      } else if (p.type === 'shock') {
        const radius = (1 - t) * 46 + 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 180, 90, ${t * 0.8})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * t + 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${120 + Math.floor(t * 100)}, 60, ${t})`;
        ctx.fill();
      } else if (p.type === 'hit') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 * t + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 142, 44, ${t})`;
        ctx.fill();
      }
    }
  }

  /**
   * 清除所有粒子
   */
  clear() {
    this.particles = [];
  }
}
