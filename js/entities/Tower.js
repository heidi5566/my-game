import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';
import { Physics } from '../systems/Physics.js';
import { SpriteRenderer } from '../systems/SpriteRenderer.js';

/**
 * 砲塔精靈幀定義 (WarSpriteSheet.png 第一排由左數過來前四個砲塔/戰車)
 */
const TOWER_SPRITES = [
  { sx: 3, sy: 3, sw: 46, sh: 47 },   // 1. 經典綠色重裝砲塔戰車 (預設第一首選)
  { sx: 55, sy: 5, sw: 47, sh: 30 },  // 2. 重型裝甲砲塔
  { sx: 111, sy: 5, sw: 63, sh: 45 }, // 3. 雙聯裝機動火砲
  { sx: 178, sy: 6, sw: 27, sh: 44 }  // 4. 防空飛彈發射防禦塔
];

/**
 * 防禦砲塔實體 (Tower Entity)
 * 繼承自 Entity，負責目標索敵、平滑旋轉瞄準、射擊冷卻與 WarSpriteSheet 精靈圖外觀繪製
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
        this.recoil = 6;
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
   * 輔助繪製正六角形底座
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
   * 繪製砲塔自身及射程圈、選中光環與 WarSpriteSheet 精靈圖
   */
  render(ctx, isSelected = false, towerImage = null) {
    const baseR = 20 + this.level * 1.5;

    // 1. 射程範圍
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79, 209, 197, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.3)';
    ctx.stroke();

    // 2. 被選中時的外圈高亮光環
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, baseR + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#f6ad55';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // 3. 砲塔強化底座平台 (Hex Base)
    ctx.save();
    ctx.translate(this.x, this.y);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, baseR);
    grad.addColorStop(0, '#2c3e50');
    grad.addColorStop(1, '#1a252f');
    Tower.drawHexPath(ctx, baseR);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#0f1720';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 4. 使用 WarSpriteSheet 精靈圖繪製旋轉砲塔與後座力
    if (towerImage) {
      // 依等級選取第一排對應砲塔（預設為第 1 個綠色戰車砲塔）
      const spriteIdx = Math.min(TOWER_SPRITES.length - 1, this.level - 1);
      const frame = TOWER_SPRITES[spriteIdx];

      // 計算帶有後座力偏移的中心點
      const recoilOffsetX = -Math.cos(this.angle) * this.recoil;
      const recoilOffsetY = -Math.sin(this.angle) * this.recoil;

      SpriteRenderer.drawFrame(
        ctx,
        towerImage,
        frame,
        this.x + recoilOffsetX,
        this.y + recoilOffsetY,
        {
          rotation: this.angle,
          scale: 0.85
        }
      );
    }

    // 5. 繪製等級標籤（置於砲塔上方）
    this.drawLevelBadge(ctx, this.x, this.y - baseR - 6, isSelected);
  }
}
