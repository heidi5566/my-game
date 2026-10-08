import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';
import { SpriteRenderer } from '../systems/SpriteRenderer.js';

/**
 * 6 大角色精靈圖幀裁切設定
 */
const CHARACTER_FRAMES = {
  cat: {
    idle: [
      { sx: 21, sy: 15, sw: 18, sh: 45 },
      { sx: 83, sy: 15, sw: 21, sh: 45 },
      { sx: 146, sy: 15, sw: 23, sh: 45 },
      { sx: 211, sy: 15, sw: 22, sh: 45 }
    ],
    attack: [
      { sx: 275, sy: 15, sw: 24, sh: 45 },
      { sx: 339, sy: 15, sw: 21, sh: 45 },
      { sx: 402, sy: 15, sw: 22, sh: 45 },
      { sx: 469, sy: 15, sw: 28, sh: 45 }
    ],
    hurt: [
      { sx: 662, sy: 15, sw: 19, sh: 45 },
      { sx: 725, sy: 15, sw: 20, sh: 45 }
    ],
    scale: 1.15
  },
  platina: {
    idle: [
      { sx: 19, sy: 38, sw: 13, sh: 17 }
    ],
    attack: [
      { sx: 19, sy: 38, sw: 13, sh: 17 },
      { sx: 36, sy: 38, sw: 12, sh: 17 },
      { sx: 19, sy: 38, sw: 13, sh: 17 }
    ],
    hurt: [
      { sx: 19, sy: 38, sw: 13, sh: 17 }
    ],
    scale: 2.2
  },
  knight: {
    idle: [
      { sx: 0, sy: 0, sw: 70, sh: 50 },
      { sx: 70, sy: 0, sw: 70, sh: 50 },
      { sx: 140, sy: 0, sw: 70, sh: 50 },
      { sx: 210, sy: 0, sw: 70, sh: 50 }
    ],
    attack: [
      { sx: 280, sy: 0, sw: 70, sh: 50 },
      { sx: 350, sy: 0, sw: 70, sh: 50 },
      { sx: 420, sy: 0, sw: 70, sh: 50 },
      { sx: 490, sy: 0, sw: 70, sh: 50 },
      { sx: 560, sy: 0, sw: 70, sh: 50 },
      { sx: 630, sy: 0, sw: 70, sh: 50 }
    ],
    hurt: [
      { sx: 700, sy: 0, sw: 70, sh: 50 },
      { sx: 770, sy: 0, sw: 70, sh: 50 }
    ],
    scale: 0.8
  },
  mage: {
    idle: [
      { sx: 192, sy: 128, sw: 48, sh: 64 },
      { sx: 144, sy: 128, sw: 48, sh: 64 },
      { sx: 240, sy: 128, sw: 48, sh: 64 }
    ],
    attack: [
      { sx: 144, sy: 128, sw: 48, sh: 64 },
      { sx: 192, sy: 128, sw: 48, sh: 64 },
      { sx: 240, sy: 128, sw: 48, sh: 64 }
    ],
    hurt: [
      { sx: 192, sy: 128, sw: 48, sh: 64 },
      { sx: 192, sy: 64, sw: 48, sh: 64 }
    ],
    scale: 0.75
  },
  dog: {
    idle: [
      { sx: 0, sy: 0, sw: 35, sh: 47 }
    ],
    attack: [
      { sx: 0, sy: 0, sw: 35, sh: 47 }
    ],
    hurt: [
      { sx: 0, sy: 0, sw: 35, sh: 47 }
    ],
    scale: 0.95
  },
  bard: {
    idle: [
      { sx: 0, sy: 0, sw: 32, sh: 32 },
      { sx: 32, sy: 0, sw: 32, sh: 32 },
      { sx: 64, sy: 0, sw: 32, sh: 32 }
    ],
    attack: [
      { sx: 0, sy: 32, sw: 32, sh: 32 },
      { sx: 32, sy: 32, sw: 32, sh: 32 },
      { sx: 64, sy: 32, sw: 32, sh: 32 }
    ],
    hurt: [
      { sx: 0, sy: 64, sw: 32, sh: 32 },
      { sx: 32, sy: 64, sw: 32, sh: 32 }
    ],
    scale: 1.25
  }
};

/**
 * 玩家/防線指揮官實體 (Player / Commander Entity)
 */
export class Player extends Entity {
  constructor(x = 610, y = 80, characterId = 'cat') {
    super(x, y);
    this.characterId = characterId;
    this.gold = CONFIG.PLAYER.INITIAL_GOLD;
    this.lives = CONFIG.PLAYER.INITIAL_LIVES;
    this.kills = 0;
    this.wave = CONFIG.PLAYER.INITIAL_WAVE;
    this.selectedTower = null;
    this.placingMode = false;

    // 動畫狀態
    this.state = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 0.14;
    this.stateTimer = 0;
    this.facingLeft = true;
  }

  /**
   * 重設玩家狀態
   */
  reset(characterConfig = null, bonusGold = 0, bonusLives = 0) {
    if (characterConfig) {
      this.characterId = characterConfig.id;
    }
    this.gold = CONFIG.PLAYER.INITIAL_GOLD + bonusGold;
    this.lives = CONFIG.PLAYER.INITIAL_LIVES + bonusLives;
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
      this.stateTimer = 0.45;
    }
  }

  canAfford(cost) {
    return this.gold >= cost;
  }

  spendGold(cost) {
    if (this.canAfford(cost)) {
      this.gold -= cost;
      this.triggerAttack();
      return true;
    }
    return false;
  }

  addGold(amount) {
    this.gold += amount;
  }

  addKill() {
    this.kills += 1;
  }

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

  update(dt) {
    this.frameTimer += dt;
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.frameIndex = 0;
      }
    }

    const charFrames = CHARACTER_FRAMES[this.characterId] || CHARACTER_FRAMES.cat;
    const currentAnim = charFrames[this.state] || charFrames.idle;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % currentAnim.length;
    }
  }

  render(ctx, spriteImage = null) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. 終點防線防護光圈
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

    // 2. 指揮官精靈圖繪製
    if (spriteImage) {
      const charFrames = CHARACTER_FRAMES[this.characterId] || CHARACTER_FRAMES.cat;
      const currentAnim = charFrames[this.state] || charFrames.idle;
      const frame = currentAnim[this.frameIndex % currentAnim.length];
      const scale = charFrames.scale || 1.0;

      // 如果是 dog 增加呼吸彈跳
      const offsetY = this.characterId === 'dog' ? Math.sin(Date.now() / 150) * 2 : 0;

      SpriteRenderer.drawFrame(ctx, spriteImage, frame, this.x, this.y - 2 + offsetY, {
        flipX: this.facingLeft,
        scale
      });
    }

    // 3. 指揮官標籤
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4fd1c5';
    ctx.fillText('COMMANDER', this.x, this.y - 28);
    ctx.restore();
  }
}
