import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';

/**
 * 砲彈/子彈實體 (Bullet Entity)
 * 繼承自 Entity，具備導引飛行與目標命中結算邏輯
 */
export class Bullet extends Entity {
  constructor(x, y, target, damage, speed = CONFIG.BULLET.SPEED) {
    super(x, y);
    this.target = target;
    this.damage = damage;
    this.speed = speed;
  }

  /**
   * 更新子彈位置與碰撞命中判定
   * @param {number} dt Delta Time
   * @param {Function} onHit 命中時回調 (bullet, target, damage)
   */
  update(dt, onHit) {
    if (this.dead) return;

    if (!this.target || this.target.dead || this.target.hp <= 0) {
      this.dead = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;

    if (step >= dist) {
      this.dead = true;
      if (onHit) {
        onHit(this, this.target, this.damage);
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  /**
   * 繪製發光子彈
   */
  render(ctx) {
    if (this.dead) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, CONFIG.BULLET.RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORS.BULLET;
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLORS.BULLET_STROKE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
