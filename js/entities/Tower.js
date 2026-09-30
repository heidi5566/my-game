import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';
import { Physics } from '../systems/Physics.js';
import { SpriteRenderer } from '../systems/SpriteRenderer.js';

/**
 * 防禦砲塔實體 (Tower Entity)
 * 繼承自 Entity，負責目標索敵、平滑旋轉瞄準、射擊冷卻與精靈圖外觀繪製
 */
export class Tower extends Entity {
  constructor(x, y, config = CONFIG.TOWER) {
    super(x, y);
    this.range = config.DEFAULT_RANGE;
    this.damage = config.DEFAULT_DAMAGE;
    this.fireRate = config.DEFAULT_FIRE_RATE;
    this.lastShot = 0;
    this.level = 1;
    this.angle = config.DEFAULT_ANGLE;
    this.recoil = 0;
  }

  /**
   * 升級砲塔
   */
  upgrade() {
    this.level += 1;
    this.damage += CONFIG.TOWER.UPGRADE_DAMAGE;
    this.range += CONFIG.TOWER.UPGRADE_RANGE;
    this.fireRate = Math.max(CONFIG.TOWER.MIN_FIRE_RATE, this.fireRate - CONFIG.TOWER.UPGRADE_FIRE_RATE_REDUCTION);
  }

  /**
   * 取得點擊判定半徑
   */
  getHitRadius() {
    return 19 + this.level * 1.8 + 5;
  }

  /**
   * 更新砲塔瞄準與開火
   */
  update(dt, now, enemies, onFire) {
    // 衰減後座力
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 15);
    }

    let best = null;
    let bestSeg = -1;

    // 尋找射程內在路徑上最領先的敵人（優先打最靠近終點者）
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Physics.pointDist(e.x, e.y, this.x, this.y);
      if (d <= this.range && e.seg > bestSeg) {
        bestSeg = e.seg;
        best = e;
      }
    }

    if (best) {
      const desired = Math.atan2(best.y - this.y, best.x - this.x);
      this.angle += Physics.normalizeAngle(desired - this.angle) * Math.min(1, dt * 8);

      if (now - this.lastShot >= this.fireRate) {
        this.lastShot = now;
        this.recoil = 5;
        if (onFire) {
          onFire(this, best, this.damage);
        }
      }
    } else {
      // 無敵人時慢速旋轉掃視
      this.angle += dt * 0.4;
    }
  }

  /**
   * 輔助繪製正六角形
   */
  static drawHexPath(ctx, r) {
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
   * 繪製等級標章
   */
  drawLevelBadge(ctx, cx, topY, highlight) {
    ctx.font = 'bold 11px sans-serif';
    const text = 'Lv ' + this.level;
    const tw = ctx.measureText(text).width;
    const pad = 6;
    const bw = tw + pad * 2;
    const bh = 16;
    const bx = cx - bw / 2;
    const by = topY - bh;
    const r = 4;

    ctx.beginPath();
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

  /**
   * 繪製砲塔自身及射程圈、選中光環
   */
  render(ctx, isSelected = false, towerImage = null) {
    const baseR = 19 + this.level * 1.8;
    const turretR = 9 + this.level * 1.3;
    const barrelLen = 20 + this.level * 2.2;

    // 1. 射程範圍
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79, 209, 197, 0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.25)';
    ctx.stroke();

    ctx.save();
    ctx.translate(this.x, this.y);

    // 2. 被選中時的外圈高亮光環
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, baseR + 7, 0, Math.PI * 2);
      ctx.strokeStyle = '#f6ad55';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // 3. 砲塔底座 (六角形科技底座 + 放射漸層)
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, baseR);
    grad.addColorStop(0, '#3a4f5e');
    grad.addColorStop(1, '#1c2833');
    Tower.drawHexPath(ctx, baseR);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#0f1720';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. 砲管 (依據 angle 旋轉與 recoil 後座力位移)
    ctx.save();
    ctx.rotate(this.angle);
    ctx.fillStyle = '#0f1720';
    ctx.fillRect(-this.recoil, -4, barrelLen, 8);
    ctx.fillStyle = '#334a5a';
    ctx.fillRect(-this.recoil, -2, barrelLen, 4);

    // 槍口能量環
    ctx.fillStyle = '#4fd1c5';
    ctx.fillRect(barrelLen - this.recoil - 3, -3, 3, 6);
    ctx.restore();

    // 5. 砲塔頂部旋轉核心圓盤 (Turret)
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

    // 6. 繪製等級標籤（置於砲塔上方）
    this.drawLevelBadge(ctx, this.x, this.y - baseR - 6, isSelected);
  }
}
