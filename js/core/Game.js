import { CONFIG } from '../config.js';
import { Physics } from '../systems/Physics.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { AssetManager } from '../systems/AssetManager.js';
import { Player } from '../entities/Player.js';
import { Tower } from '../entities/Tower.js';
import { Enemy } from '../entities/Enemy.js';
import { Bullet } from '../entities/Bullet.js';
import { HUD } from '../ui/HUD.js';
import { InputHandler } from './InputHandler.js';
import { GameLoop } from './GameLoop.js';

/**
 * 遊戲主引擎主控器 (Game Controller / Engine)
 * 負責協調實體、精靈圖繪製、音訊管理、物理判定、波次排程與視圖更新
 */
export class Game {
  constructor(canvasId = 'game') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`找不到 ID 為 ${canvasId} 的 Canvas 節點`);
    }
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // 資源管理與系統模組
    this.assetManager = new AssetManager();
    this.audioSystem = new AudioSystem(this.assetManager);
    this.particleSystem = new ParticleSystem();
    this.hud = new HUD();
    this.inputHandler = new InputHandler(this.canvas);

    // 實體與狀態
    this.player = new Player(610, 80);
    this.towers = [];
    this.enemies = [];
    this.bullets = [];

    // 波次控制
    this.waveActive = false;
    this.spawnQueue = 0;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.isLoaded = false;

    // 遊戲循環
    this.loop = new GameLoop(
      (dt, now) => this.update(dt, now),
      (now) => this.render(now)
    );
  }

  /**
   * 初始化與預載入所有遊戲資源
   */
  async init() {
    this.hud.showLoading();

    // 宣告相對路徑資源清單（防止 GitHub Pages 絕對路徑破壞）
    const manifest = {
      images: {
        background: './assets/images/background.png',
        player: './assets/images/player.png',
        enemy: './assets/images/enemy.png',
        tower: './assets/images/tower.png',
        effects: './assets/images/effects.png'
      },
      audios: {
        bgm: './assets/audio/bgm.mp3',
        sfx_hit: './assets/audio/sfx_hit.wav'
      }
    };

    try {
      await this.assetManager.preloadAll(manifest, (loaded, total) => {
        this.hud.updateLoadingProgress(loaded, total);
      });
    } catch (err) {
      console.warn('[GameEngine] 資源預載入警告 (啟動備用保護機制):', err);
    } finally {
      this.isLoaded = true;
      this.hud.hideLoading();
    }

    this.setupInitialState();
    this.setupEventHandlers();
    this.hud.update(this.getHUDState());
  }

  /**
   * 啟動遊戲引擎
   */
  async start() {
    await this.init();
    this.loop.start();
  }

  /**
   * 設定初始砲塔與數據
   */
  setupInitialState() {
    this.player.reset();
    this.towers = [
      new Tower(CONFIG.TOWER.INITIAL_POSITION.x, CONFIG.TOWER.INITIAL_POSITION.y)
    ];
    this.player.selectedTower = this.towers[0];
    this.enemies = [];
    this.bullets = [];
    this.particleSystem.clear();
    this.waveActive = false;
    this.spawnQueue = 0;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.player.placingMode = false;
    this.inputHandler.setCursorPlacing(false);
    this.hud.showMessage('');
    this.hud.setStartWaveDisabled(false);
    this.hud.hideOverlay();
  }

  /**
   * 封裝 HUD 當前狀態資訊
   */
  getHUDState() {
    return {
      wave: this.player.wave,
      gold: this.player.gold,
      lives: this.player.lives,
      kills: this.player.kills,
      selectedTower: this.player.selectedTower,
      towerCount: this.towers.length
    };
  }

  /**
   * 綁定使用者操作與按鈕事件
   */
  setupEventHandlers() {
    // 首次任意使用者交互（點擊、鍵盤）解鎖瀏覽器 Autoplay Policy
    const unlockOnFirstGesture = () => {
      this.audioSystem.ensureAudio();
      window.removeEventListener('pointerdown', unlockOnFirstGesture);
      window.removeEventListener('keydown', unlockOnFirstGesture);
    };
    window.addEventListener('pointerdown', unlockOnFirstGesture, { once: true });
    window.addEventListener('keydown', unlockOnFirstGesture, { once: true });

    // 綁定 HUD 按鈕事件
    this.hud.bindEvents({
      onStartWave: () => this.startWave(),
      onTogglePlace: () => this.togglePlacingMode(),
      onUpgrade: () => this.upgradeSelectedTower(),
      onRestart: () => this.resetGame(),
      onToggleSound: () => {
        const soundOn = this.audioSystem.toggleSound();
        this.hud.setSoundState(soundOn);
      },
      onToggleMusic: () => {
        const musicOn = this.audioSystem.toggleMusic();
        this.hud.setMusicState(musicOn);
      }
    });

    // 綁定畫布點擊事件
    this.inputHandler.onClick = (pos) => this.handleCanvasClick(pos);
  }

  /**
   * 處理畫布點擊邏輯（選取砲塔或放置新砲塔）
   */
  handleCanvasClick(pos) {
    this.audioSystem.ensureAudio();
    if (this.gameOver) return;

    if (this.player.placingMode) {
      if (!this.player.canAfford(CONFIG.TOWER.NEW_COST)) {
        this.hud.showMessage('金幣不足，無法放置砲塔');
        return;
      }

      const isValid = Physics.isValidPlacement(
        pos.x, pos.y,
        CONFIG.PATH,
        this.towers,
        CONFIG.PATH_CLEARANCE,
        CONFIG.TOWER.MIN_GAP,
        this.width, this.height
      );

      if (!isValid) {
        this.hud.showMessage('此位置太靠近路徑或其他砲塔，請換個地方');
        return;
      }

      // 成功扣款建造
      this.player.spendGold(CONFIG.TOWER.NEW_COST);
      const newTower = new Tower(pos.x, pos.y);
      this.towers.push(newTower);
      this.player.selectedTower = newTower;
      this.player.placingMode = false;
      this.inputHandler.setCursorPlacing(false);
      this.hud.showMessage('新砲塔已成功部署！', 1800);
      this.audioSystem.playPlace();
      this.hud.update(this.getHUDState());
      return;
    }

    // 點擊選取場上現存砲塔
    let clicked = null;
    for (const t of this.towers) {
      if (Physics.pointDist(pos.x, pos.y, t.x, t.y) <= t.getHitRadius()) {
        clicked = t;
        break;
      }
    }

    if (clicked) {
      this.player.selectedTower = clicked;
      this.hud.update(this.getHUDState());
    }
  }

  /**
   * 切換放置新砲塔模式
   */
  togglePlacingMode() {
    this.audioSystem.ensureAudio();
    if (!this.player.canAfford(CONFIG.TOWER.NEW_COST) || this.towers.length >= CONFIG.TOWER.MAX_COUNT) {
      return;
    }

    this.player.placingMode = !this.player.placingMode;
    this.inputHandler.setCursorPlacing(this.player.placingMode);
    this.hud.showMessage(
      this.player.placingMode ? '請點擊畫面空地放置新砲塔（不可太靠近路徑）' : ''
    );
  }

  /**
   * 升級當前選取的砲塔
   */
  upgradeSelectedTower() {
    this.audioSystem.ensureAudio();
    if (this.player.selectedTower && this.player.canAfford(CONFIG.TOWER.UPGRADE_COST)) {
      this.player.spendGold(CONFIG.TOWER.UPGRADE_COST);
      this.player.selectedTower.upgrade();
      this.audioSystem.playUpgrade();
      this.hud.update(this.getHUDState());
    }
  }

  /**
   * 開始新波次
   */
  startWave() {
    this.audioSystem.ensureAudio();
    if (this.waveActive || this.gameOver) return;

    this.waveActive = true;
    this.spawnQueue = CONFIG.ENEMY.getQueueCount(this.player.wave);
    this.spawnTimer = 0;
    this.audioSystem.playWaveStart();
    this.hud.setStartWaveDisabled(true);
  }

  /**
   * 產生單一敵人
   */
  spawnEnemy() {
    const enemy = new Enemy(CONFIG.PATH, this.player.wave);
    this.enemies.push(enemy);
  }

  /**
   * 發射子彈
   */
  fireBullet(fromTower, target, damage) {
    const bullet = new Bullet(fromTower.x, fromTower.y, target, damage, CONFIG.BULLET.SPEED);
    this.bullets.push(bullet);
    this.player.triggerAttack();
    this.audioSystem.playShoot();
  }

  /**
   * 檢查當前波次是否結束
   */
  checkWaveEnd() {
    if (this.waveActive && this.spawnQueue <= 0 && this.enemies.every(e => e.dead)) {
      this.waveActive = false;
      this.enemies = [];
      this.player.wave += 1;
      this.player.addGold(CONFIG.PLAYER.WAVE_CLEAR_REWARD);
      this.audioSystem.playVictory();
      this.hud.setStartWaveDisabled(false);
    }
  }

  /**
   * 結束遊戲
   */
  endGame(win) {
    this.gameOver = true;
    if (win) {
      this.audioSystem.playVictory();
    } else {
      this.audioSystem.playGameOver();
    }
    this.hud.showOverlay(win, this.player.wave, this.player.kills);
  }

  /**
   * 重新開始遊戲
   */
  resetGame() {
    this.setupInitialState();
    this.hud.update(this.getHUDState());
  }

  /**
   * 邏輯更新 (Tick)
   */
  update(dt, now) {
    if (this.gameOver) return;

    // 更新玩家動畫計時
    this.player.update(dt);

    // 波次敵人生產節奏
    if (this.waveActive) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.spawnQueue > 0) {
        this.spawnEnemy();
        this.spawnQueue -= 1;
        this.spawnTimer = CONFIG.ENEMY.SPAWN_INTERVAL;
      }
    }

    // 敵人移動
    for (const e of this.enemies) {
      if (!e.dead) {
        e.update(dt, CONFIG.PATH, (deadEnemy) => {
          const isDead = this.player.takeDamage(1);
          if (isDead) {
            this.endGame(false);
          }
        });
      }
    }

    // 砲塔瞄準與開火
    for (const t of this.towers) {
      t.update(dt, now, this.enemies, (tower, target, damage) => {
        this.fireBullet(tower, target, damage);
      });
    }

    // 子彈移動與命中結算
    for (const b of this.bullets) {
      if (!b.dead) {
        b.update(dt, (bullet, target, damage) => {
          const currentHp = target.takeDamage(damage);
          if (currentHp > 0) {
            this.particleSystem.spawnHit(target.x, target.y);
            this.audioSystem.playHit();
          } else if (!target.dead) {
            target.dead = true;
            this.player.addGold(target.reward);
            this.player.addKill();
            this.particleSystem.spawnExplosion(target.x, target.y);
            this.audioSystem.playExplosion();
          }
        });
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);

    // 粒子系統更新
    this.particleSystem.update(dt);

    // 波次結算與 HUD 更新
    this.checkWaveEnd();
    this.hud.update(this.getHUDState());
  }

  /**
   * 繪製防守路徑（若已有背景圖則僅繪製精細導引光點，未載入時繪製備用路徑）
   */
  drawPath(hasBgImage = false) {
    const ctx = this.ctx;
    const path = CONFIG.PATH;

    if (!hasBgImage) {
      // 備用底層路基
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }

    // 中央微光科技導引線
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * 繪製建造中的砲塔放置預覽光圈
   */
  drawPlacementPreview(mx, my) {
    if (!this.player.placingMode || mx === null || my === null) return;

    const valid = Physics.isValidPlacement(
      mx, my,
      CONFIG.PATH,
      this.towers,
      CONFIG.PATH_CLEARANCE,
      CONFIG.TOWER.MIN_GAP,
      this.width, this.height
    );

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(mx, my);
    Tower.drawHexPath(ctx, 19);
    ctx.fillStyle = valid ? 'rgba(79, 209, 197, 0.5)' : 'rgba(245, 101, 101, 0.5)';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(mx, my, CONFIG.TOWER.DEFAULT_RANGE, 0, Math.PI * 2);
    ctx.strokeStyle = valid ? 'rgba(79, 209, 197, 0.4)' : 'rgba(245, 101, 101, 0.4)';
    ctx.stroke();
  }

  /**
   * 繪製製作人浮水印標籤
   */
  drawProducerWatermark() {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('製作人：11311385', 12, this.height - 10);
    ctx.restore();
  }

  /**
   * 畫面渲染 (Render)
   */
  render(now) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. 繪製由 Road_test.png 組成的背景地圖
    const bgImg = this.assetManager.getImage('background');
    const hasBg = !!bgImg;
    if (hasBg) {
      this.ctx.drawImage(bgImg, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = CONFIG.COLORS.BG;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. 繪製路徑導引線
    this.drawPath(hasBg);

    // 3. 繪製基地防線指揮官 (Player Entity - drawImage 動態精靈切分播放)
    const playerImg = this.assetManager.getImage('player');
    this.player.render(this.ctx, playerImg);

    // 4. 繪製防禦砲塔
    const towerImg = this.assetManager.getImage('tower');
    for (const t of this.towers) {
      t.render(this.ctx, t === this.player.selectedTower, towerImg);
    }

    // 5. 繪製飛行的子彈
    for (const b of this.bullets) {
      b.render(this.ctx);
    }

    // 6. 繪製行進中的敵人 (Enemy Entity - drawImage 動態精靈切分播放與鏡像翻轉)
    const enemyImg = this.assetManager.getImage('enemy');
    for (const e of this.enemies) {
      e.render(this.ctx, enemyImg, now);
    }

    // 7. 繪製爆炸與受擊粒子
    const effectsImg = this.assetManager.getImage('effects');
    this.particleSystem.render(this.ctx, effectsImg);

    // 8. 繪製建造模式的預覽游標
    const mousePos = this.inputHandler.getMousePos();
    this.drawPlacementPreview(mousePos.x, mousePos.y);

    // 9. 繪製製作人標記
    this.drawProducerWatermark();
  }
}
