import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';
import { SpriteRenderer } from '../systems/SpriteRenderer.js';

/**
 * 玩家動作精靈幀定義 (Player Sprite Frames - cat2_base.png / player.png)
 */
const PLAYER_FRAMES = {
  idle: [
    { sx: 21, sy: 15, sw: 18, sh: 45 },
    { sx: 83, sy: 15, sw: 21, sh: 45 },
    { sx: 146, sy: 15, sw: 23, sh: 45 },
    { sx: 211, sy: 15, sw: 22, sh: 45 }
  ],
  run: [
    { sx: 21, sy: 270, sw: 17, sh: 45 },
    { sx: 87, sy: 270, sw: 15, sh: 45 },
    { sx: 149, sy: 270, sw: 21, sh: 45 },
    { sx: 215, sy: 270, sw: 22, sh: 45 },
    { sx: 277, sy: 270, sw: 24, sh: 45 },
    { sx: 343, sy: 270, sw: 20, sh: 45 }
  ],
  attack: [
    { sx: 275, sy: 15, sw: 24, sh: 45 },
    { sx: 339, sy: 15, sw: 21, sh: 45 },
    { sx: 402, sy: 15, sw: 22, sh: 45 },
    { sx: 469, sy: 15, sw: 28, sh: 45 },
    { sx: 534, sy: 15, sw: 26, sh: 45 },
    { sx: 597, sy: 15, sw: 25, sh: 45 }
  ],
  hurt: [
    { sx: 662, sy: 15, sw: 19, sh: 45 },
    { sx: 725, sy: 15, sw: 20, sh: 45 }
  ]
};

/**
 * 玩家/防線指揮官實體 (Player / Commander Entity)
 * 繼承自 Entity 基類，管理防禦陣地核心資源（金幣、生命、擊殺與建造狀態），
 * 並透過 drawImage() 播放待機、攻擊、受擊多幀動畫與方向反轉
 */
export class Player extends Entity {
  constructor(x = 615, y = 80) {
    super(x, y);
    this.gold = CONFIG.PLAYER.INITIAL_GOLD;
    this.lives = CONFIG.PLAYER.INITIAL_LIVES;
    this.kills = 0;
    this.wave = CONFIG.PLAYER.INITIAL_WAVE;
    this.selectedTower = null;
    this.placingMode = false;

    // 動畫狀態
    this.state = 'idle'; // 'idle', 'run', 'attack', 'hurt'
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 0.14; // 秒/幀
    this.stateTimer = 0;
    this.facingLeft = true; // 預設面向戰場左側迎敵
  }

  /**
   * 重設玩家狀態
   */
  reset() {
    this.gold = CONFIG.PLAYER.INITIAL_GOLD;
    this.lives = CONFIG.PLAYER.INITIAL_LIVES;
    this.kills = 0;
    this.wave = CONFIG.PLAYER.INITIAL_WAVE;
    this.selectedTower = null;
    this.placingMode = false;
    this.dead = false;
    this.state = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.stateTimer = 0;
    this.facingLeft = true;
  }

  /**
   * 觸發玩家攻擊/施法動作
   */
  triggerAttack() {
    if (this.state !== 'hurt') {
      this.state = 'attack';
      this.frameIndex = 0;
      this.stateTimer = 0.5;
    }
  }

  /**
   * 檢查金幣是否足夠
   */
  canAfford(cost) {
    return this.gold >= cost;
  }

  /**
   * 扣除金幣
   */
  spendGold(cost) {
    if (this.canAfford(cost)) {
      this.gold -= cost;
      this.triggerAttack();
      return true;
    }
    return false;
  }

  /**
   * 增加金幣
   */
  addGold(amount) {
    this.gold += amount;
  }

  /**
   * 增加擊殺數
   */
  addKill() {
    this.kills += 1;
  }

  /**
   * 承受傷害（敵人突破防線）
   */
  takeDamage(amount = 1) {
    this.lives -= amount;
    this.state = 'hurt';
    this.frameIndex = 0;
    this.stateTimer = 0.4;
    if (this.lives <= 0) {
      this.lives = 0;
      this.dead = true;
    }
    return this.dead;
  }

  /**
   * 更新動畫幀計時
   */
  update(dt) {
    this.frameTimer += dt;
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.frameIndex = 0;
      }
    }

    const currentAnim = PLAYER_FRAMES[this.state] || PLAYER_FRAMES.idle;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % currentAnim.length;
    }
  }

  /**
   * 繪製基地終點防護核心與指揮官精靈
   */
  render(ctx, spriteImage = null) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. 終點防線防護光圈 (Portal / Base Aura)
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.strokeStyle = this.state === 'hurt' ? 'rgba(245, 101, 101, 0.8)' : 'rgba(79, 209, 197, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 基地平台底座光暈
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.state === 'hurt' ? 'rgba(245, 101, 101, 0.25)' : 'rgba(79, 209, 197, 0.25)';
    ctx.fill();

    ctx.restore();

    // 2. 指揮官精靈圖繪製 (drawImage 切分多幀與左右鏡像翻轉)
    if (spriteImage) {
      const currentAnim = PLAYER_FRAMES[this.state] || PLAYER_FRAMES.idle;
      const frame = currentAnim[this.frameIndex % currentAnim.length];
      SpriteRenderer.drawFrame(ctx, spriteImage, frame, this.x, this.y - 2, {
        flipX: this.facingLeft,
        scale: 1.15
      });
    }

    // 3. 指揮官標籤
    ctx.save();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4fd1c5';
    ctx.fillText('COMMANDER', this.x, this.y - 28);
    ctx.restore();
  }
}
