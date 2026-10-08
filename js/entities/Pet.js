import { SpriteRenderer } from '../systems/SpriteRenderer.js';

/**
 * 寵物實體 (Pet Entity)
 * 陪伴在基地指揮官身旁，具有輕盈懸浮/跳動動畫與增益光環
 */
export class Pet {
  constructor(petConfig, commanderX, commanderY) {
    this.config = petConfig;
    this.x = commanderX - 26;
    this.y = commanderY + 12;
    this.floatTimer = 0;
    this.facingLeft = true;
  }

  /**
   * 更新寵物跟隨與浮動
   */
  update(dt, commanderX, commanderY) {
    this.floatTimer += dt * 4;
    this.x = commanderX - 26;
    this.y = commanderY + 12 + Math.sin(this.floatTimer) * 4;
  }

  /**
   * 繪製寵物及專屬光環
   */
  render(ctx, petSheet) {
    if (!this.config || !petSheet) return;

    ctx.save();
    // 1. 光環光圈
    ctx.beginPath();
    ctx.arc(this.x, this.y + 2, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79, 209, 197, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(246, 173, 85, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. 繪製寵物精靈
    const frame = this.config.frame;
    SpriteRenderer.drawFrame(ctx, petSheet, frame, this.x, this.y, {
      scale: 1.4,
      flipX: this.facingLeft
    });

    // 3. 寵物名稱標籤
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6ad55';
    ctx.fillText(this.config.name, this.x, this.y - 12);

    ctx.restore();
  }
}
