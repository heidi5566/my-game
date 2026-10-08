import { CONFIG } from '../config.js';
import { Physics } from '../systems/Physics.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { AssetManager } from '../systems/AssetManager.js';
import { Player } from '../entities/Player.js';
import { Tower } from '../entities/Tower.js';
import { Enemy } from '../entities/Enemy.js';
import { Bullet } from '../entities/Bullet.js';
import { Pet } from '../entities/Pet.js';
import { HUD } from '../ui/HUD.js';
import { InputHandler } from './InputHandler.js';
import { GameLoop } from './GameLoop.js';

/**
 * 遊戲主引擎主控器 (Game Controller / Engine)
 * 負責協調主選單、多關卡路線生成、角色選擇、寵物增益、波次魔物輪替與戰鬥循環
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

    // 系統模組
    this.assetManager = new AssetManager();
    this.audioSystem = new AudioSystem(this.assetManager);
    this.particleSystem = new ParticleSystem();
    this.hud = new HUD();
    this.inputHandler = new InputHandler(this.canvas);

    // 持久化進度讀取 (localStorage)
    this.unlockedLevelMax = parseInt(localStorage.getItem('mini_td_unlocked_level') || '1', 10);
    this.selectedCharId = localStorage.getItem('mini_td_selected_char') || 'cat';
    this.selectedPetId = localStorage.getItem('mini_td_selected_pet') || null;

    // 當前關卡與實體
    this.currentLevelId = 1;
    this.currentLevel = CONFIG.LEVELS[0];
    this.player = new Player(610, 80, this.selectedCharId);
    this.pet = null;
    this.towers = [];
    this.enemies = [];
    this.bullets = [];

    // 遊戲狀態與波次
    this.gameState = 'MENU'; // 'MENU' | 'PLAYING'
    this.waveActive = false;
    this.spawnQueue = 0;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.isLoaded = false;

    // 循環
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

    const manifest = {
      images: {
        bg_level_1: './assets/images/bg_level_1.png',
        bg_level_2: './assets/images/bg_level_2.png',
        bg_level_3: './assets/images/bg_level_3.png',
        bg_level_4: './assets/images/bg_level_4.png',
        bg_level_5: './assets/images/bg_level_5.png',
        bg_level_6: './assets/images/bg_level_6.png',
        char_cat: './assets/images/char_cat.png',
        char_platina: './assets/images/char_platina.png',
        char_knight: './assets/images/char_knight.png',
        char_mage: './assets/images/char_mage.png',
        char_dog: './assets/images/char_dog.png',
        char_bard: './assets/images/char_bard.png',
        enemy_mon1: './assets/images/enemy_mon1.png',
        enemy_mon2: './assets/images/enemy_mon2.png',
        enemy_mon3: './assets/images/enemy_mon3.png',
        enemy_skull: './assets/images/enemy_skull.png',
        enemy_spiky: './assets/images/enemy_spiky.png',
        enemy_goblin: './assets/images/enemy_goblin.png',
        pet_sheet: './assets/images/pet_sheet.png',
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
      console.warn('[GameEngine] 資源預載入警示:', err);
    } finally {
      this.isLoaded = true;
      this.hud.hideLoading();
    }

    this.setupPet();
    this.setupEventHandlers();
    this.refreshMenuDisplay();
    this.hud.showScreen('menu');
  }

  /**
   * 啟動遊戲引擎
   */
  async start() {
    await this.init();
    this.loop.start();
  }

  /**
   * 設定與更新上陣寵物
   */
  setupPet() {
    if (this.selectedPetId) {
      const petCfg = CONFIG.PETS.find(p => p.id === this.selectedPetId);
      if (petCfg) {
        this.pet = new Pet(petCfg, this.player.x, this.player.y);
      } else {
        this.pet = null;
      }
    } else {
      this.pet = null;
    }
  }

  /**
   * 刷新主選單看板與彈窗清單
   */
  refreshMenuDisplay() {
    const charCfg = CONFIG.CHARACTERS.find(c => c.id === this.selectedCharId) || CONFIG.CHARACTERS[0];
    const petCfg = CONFIG.PETS.find(p => p.id === this.selectedPetId);

    this.hud.updateMenuStats(
      this.unlockedLevelMax,
      charCfg.name,
      petCfg ? petCfg.name : '無'
    );

    this.hud.renderLevelGrid(this.unlockedLevelMax, this.currentLevelId, (lvlId) => {
      this.startLevel(lvlId);
    });

    this.hud.renderCharGrid(this.selectedCharId, (charId) => {
      this.selectedCharId = charId;
      localStorage.setItem('mini_td_selected_char', charId);
      this.refreshMenuDisplay();
    });

    this.hud.renderPetGrid(this.unlockedLevelMax, this.selectedPetId, (petId) => {
      this.selectedPetId = petId;
      if (petId) {
        localStorage.setItem('mini_td_selected_pet', petId);
      } else {
        localStorage.removeItem('mini_td_selected_pet');
      }
      this.setupPet();
      this.refreshMenuDisplay();
    });
  }

  /**
   * 載入並開始指定關卡
   */
  startLevel(levelId) {
    this.audioSystem.ensureAudio();
    this.currentLevelId = levelId;
    this.currentLevel = CONFIG.LEVELS.find(l => l.id === levelId) || CONFIG.LEVELS[0];

    const charCfg = CONFIG.CHARACTERS.find(c => c.id === this.selectedCharId) || CONFIG.CHARACTERS[0];
    const bonusGold = charCfg.perk?.startGoldBonus || 0;
    const bonusLives = charCfg.perk?.bonusLives || 0;

    // 重設玩家與指揮官位置
    this.player.x = this.currentLevel.commanderPos.x;
    this.player.y = this.currentLevel.commanderPos.y;
    this.player.reset(charCfg, bonusGold, bonusLives);

    // 重新佈設上陣寵物
    this.setupPet();

    // 清空玩家自由擺放的舊砲塔，重設該關初始防禦塔
    this.towers = [
      new Tower(this.currentLevel.initialTower.x, this.currentLevel.initialTower.y)
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

    this.gameState = 'PLAYING';
    this.hud.showScreen('game');
    this.hud.showMessage(`進入 ${this.currentLevel.name}！請部署防線。`, 2500);
    this.hud.setStartWaveDisabled(false);
    this.hud.hideOverlay();
    this.updateHUD();
  }

  /**
   * 綁定使用者操作與按鈕事件
   */
  setupEventHandlers() {
    const unlockOnFirstGesture = () => {
      this.audioSystem.ensureAudio();
      window.removeEventListener('pointerdown', unlockOnFirstGesture);
      window.removeEventListener('keydown', unlockOnFirstGesture);
    };
    window.addEventListener('pointerdown', unlockOnFirstGesture, { once: true });
    window.addEventListener('keydown', unlockOnFirstGesture, { once: true });

    this.hud.bindEvents({
      onOpenLevelModal: () => {
        this.audioSystem.ensureAudio();
        this.refreshMenuDisplay();
        this.hud.openModal(this.hud.levelModal);
      },
      onOpenCharModal: () => {
        this.audioSystem.ensureAudio();
        this.refreshMenuDisplay();
        this.hud.openModal(this.hud.charModal);
      },
      onOpenPetModal: () => {
        this.audioSystem.ensureAudio();
        this.refreshMenuDisplay();
        this.hud.openModal(this.hud.petModal);
      },
      onBackToMenu: () => {
        this.gameState = 'MENU';
        this.refreshMenuDisplay();
        this.hud.showScreen('menu');
      },
      onStartWave: () => this.startWave(),
      onTogglePlace: () => this.togglePlacingMode(),
      onUpgrade: () => this.upgradeSelectedTower(),
      onRestart: () => this.startLevel(this.currentLevelId),
      onNextLevel: () => {
        if (this.currentLevelId < CONFIG.LEVELS.length) {
          this.startLevel(this.currentLevelId + 1);
        }
      },
      onToggleSound: () => {
        const soundOn = this.audioSystem.toggleSound();
        this.hud.setSoundState(soundOn);
      },
      onToggleMusic: () => {
        const musicOn = this.audioSystem.toggleMusic();
        this.hud.setMusicState(musicOn);
      }
    });

    this.inputHandler.onClick = (pos) => this.handleCanvasClick(pos);
  }

  handleCanvasClick(pos) {
    this.audioSystem.ensureAudio();
    if (this.gameState !== 'PLAYING' || this.gameOver) return;

    if (this.player.placingMode) {
      if (!this.player.canAfford(CONFIG.TOWER.NEW_COST)) {
        this.hud.showMessage('金幣不足，無法放置砲塔');
        return;
      }

      const isValid = Physics.isValidPlacement(
        pos.x, pos.y,
        this.currentLevel.path,
        this.towers,
        CONFIG.PATH_CLEARANCE,
        CONFIG.TOWER.MIN_GAP,
        this.width, this.height
      );

      if (!isValid) {
        this.hud.showMessage('此位置太靠近路徑或其他砲塔，請換個地方');
        return;
      }

      this.player.spendGold(CONFIG.TOWER.NEW_COST);
      const newTower = new Tower(pos.x, pos.y);
      this.towers.push(newTower);
      this.player.selectedTower = newTower;
      this.player.placingMode = false;
      this.inputHandler.setCursorPlacing(false);
      this.hud.showMessage('新砲塔已成功部署！', 1800);
      this.audioSystem.playPlace();
      this.updateHUD();
      return;
    }

    let clicked = null;
    for (const t of this.towers) {
      if (Physics.pointDist(pos.x, pos.y, t.x, t.y) <= t.getHitRadius()) {
        clicked = t;
        break;
      }
    }

    if (clicked) {
      this.player.selectedTower = clicked;
      this.updateHUD();
    }
  }

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

  upgradeSelectedTower() {
    this.audioSystem.ensureAudio();
    if (this.player.selectedTower && this.player.canAfford(CONFIG.TOWER.UPGRADE_COST)) {
      this.player.spendGold(CONFIG.TOWER.UPGRADE_COST);
      this.player.selectedTower.upgrade();
      this.audioSystem.playUpgrade();
      this.updateHUD();
    }
  }

  startWave() {
    this.audioSystem.ensureAudio();
    if (this.waveActive || this.gameOver) return;

    this.waveActive = true;
    this.spawnQueue = CONFIG.ENEMY.getQueueCount(this.player.wave);
    this.spawnTimer = 0;
    this.audioSystem.playWaveStart();
    this.hud.setStartWaveDisabled(true);
  }

  spawnEnemy() {
    const enemy = new Enemy(this.currentLevel.path, this.player.wave);
    this.enemies.push(enemy);
  }

  fireBullet(fromTower, target, baseDamage) {
    let damage = baseDamage;

    // 角色加成
    const charCfg = CONFIG.CHARACTERS.find(c => c.id === this.selectedCharId);
    if (charCfg?.perk?.damageMul) {
      damage *= charCfg.perk.damageMul;
    }

    // 寵物加成
    if (this.pet?.config?.buff?.damageMul) {
      damage *= this.pet.config.buff.damageMul;
    }

    // 暴擊檢定
    if (this.pet?.config?.buff?.critChance && Math.random() < this.pet.config.buff.critChance) {
      damage *= 2;
    }

    const bullet = new Bullet(fromTower.x, fromTower.y, target, damage, CONFIG.BULLET.SPEED);
    this.bullets.push(bullet);
    this.player.triggerAttack();
    this.audioSystem.playShoot();
  }

  checkWaveEnd() {
    if (this.waveActive && this.spawnQueue <= 0 && this.enemies.every(e => e.dead)) {
      this.waveActive = false;
      this.enemies = [];

      // 檢查是否通關當前關卡
      if (this.player.wave >= this.currentLevel.waves) {
        this.handleLevelVictory();
      } else {
        this.player.wave += 1;

        let clearReward = CONFIG.PLAYER.WAVE_CLEAR_REWARD;
        const charCfg = CONFIG.CHARACTERS.find(c => c.id === this.selectedCharId);
        if (charCfg?.perk?.goldBonusMul) {
          clearReward = Math.round(clearReward * charCfg.perk.goldBonusMul);
        }

        this.player.addGold(clearReward);
        this.audioSystem.playVictory();
        this.hud.setStartWaveDisabled(false);
      }
    }
  }

  handleLevelVictory() {
    this.gameOver = true;
    this.audioSystem.playVictory();

    let newPetMsg = '';
    const nextLevelId = this.currentLevelId + 1;

    // 解鎖新關卡存檔
    if (this.currentLevelId >= this.unlockedLevelMax && nextLevelId <= CONFIG.LEVELS.length) {
      this.unlockedLevelMax = nextLevelId;
      localStorage.setItem('mini_td_unlocked_level', this.unlockedLevelMax.toString());

      // 檢查是否達成每 3 關解鎖新寵物條件
      const unlockedPet = CONFIG.PETS.find(p => p.unlockLevel === this.currentLevelId);
      if (unlockedPet) {
        newPetMsg = `獲得新神寵【${unlockedPet.name}】！可前往「獲得寵物」裝備！`;
      }
    }

    const hasNext = nextLevelId <= CONFIG.LEVELS.length;
    this.hud.showOverlay(true, this.player.wave, this.player.kills, hasNext, newPetMsg);
  }

  endGame(win) {
    this.gameOver = true;
    if (win) {
      this.audioSystem.playVictory();
    } else {
      this.audioSystem.playGameOver();
    }
    this.hud.showOverlay(false, this.player.wave, this.player.kills);
  }

  updateHUD() {
    const charCfg = CONFIG.CHARACTERS.find(c => c.id === this.selectedCharId) || CONFIG.CHARACTERS[0];
    this.hud.updateHUD({
      wave: this.player.wave,
      maxWaves: this.currentLevel.waves,
      gold: this.player.gold,
      lives: this.player.lives,
      kills: this.player.kills,
      selectedTower: this.player.selectedTower,
      towerCount: this.towers.length,
      currentLevel: this.currentLevel,
      charName: charCfg.name
    });
  }

  update(dt, now) {
    if (this.gameState !== 'PLAYING' || this.gameOver) return;

    this.player.update(dt);
    if (this.pet) {
      this.pet.update(dt, this.player.x, this.player.y);
    }

    // 波次敵人生產
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
        e.update(dt, this.currentLevel.path, (deadEnemy) => {
          const isDead = this.player.takeDamage(1);
          if (isDead) {
            this.endGame(false);
          }
        });
      }
    }

    // 砲塔瞄準與開火
    for (const t of this.towers) {
      // 角色與寵物射速射程加成
      const charCfg = CONFIG.CHARACTERS.find(c => c.id === this.selectedCharId);
      const fireRateMul = (charCfg?.perk?.fireRateMul || 1.0) * (this.pet?.config?.buff?.fireRateMul || 1.0);
      const effectiveFireRate = t.fireRate * fireRateMul;

      t.update(dt, now, this.enemies, (tower, target, damage) => {
        this.fireBullet(tower, target, damage);
      });
    }

    // 子彈移動與命中
    for (const b of this.bullets) {
      if (!b.dead) {
        b.update(dt, (bullet, target, damage) => {
          const currentHp = target.takeDamage(damage);
          if (currentHp > 0) {
            this.particleSystem.spawnHit(target.x, target.y);
            this.audioSystem.playHit();
          } else if (!target.dead) {
            target.dead = true;
            let reward = target.reward;
            if (this.pet?.config?.buff?.extraKillGold) {
              reward += this.pet.config.buff.extraKillGold;
            }
            this.player.addGold(reward);
            this.player.addKill();
            this.particleSystem.spawnExplosion(target.x, target.y);
            this.audioSystem.playExplosion();
          }
        });
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);

    this.particleSystem.update(dt);
    this.checkWaveEnd();
    this.updateHUD();
  }

  drawPlacementPreview(mx, my) {
    if (!this.player.placingMode || mx === null || my === null) return;

    const valid = Physics.isValidPlacement(
      mx, my,
      this.currentLevel.path,
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

  render(now) {
    if (this.gameState !== 'PLAYING') return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. 繪製當前關卡背景圖
    const bgKey = `bg_level_${this.currentLevelId}`;
    const bgImg = this.assetManager.getImage(bgKey) || this.assetManager.getImage('bg_level_1');
    if (bgImg) {
      this.ctx.drawImage(bgImg, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = CONFIG.COLORS.BG;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. 繪製指揮官角色 (6 大角色切換)
    const charCfg = CONFIG.CHARACTERS.find(c => c.id === this.selectedCharId) || CONFIG.CHARACTERS[0];
    const playerImg = this.assetManager.getImage(charCfg.assetKey);
    this.player.render(this.ctx, playerImg);

    // 3. 繪製上陣寵物
    if (this.pet) {
      const petSheet = this.assetManager.getImage('pet_sheet');
      this.pet.render(this.ctx, petSheet);
    }

    // 4. 繪製防禦砲塔 (WarSpriteSheet 戰車)
    const towerImg = this.assetManager.getImage('tower');
    for (const t of this.towers) {
      t.render(this.ctx, t === this.player.selectedTower, towerImg);
    }

    // 5. 繪製飛行的子彈
    for (const b of this.bullets) {
      b.render(this.ctx);
    }

    // 6. 繪製敵人 (每 3 波更換魔物外觀)
    for (const e of this.enemies) {
      const enemyImg = this.assetManager.getImage(e.assetKey);
      e.render(this.ctx, enemyImg, now);
    }

    // 7. 繪製爆炸與受擊粒子
    const effectsImg = this.assetManager.getImage('effects');
    this.particleSystem.render(this.ctx, effectsImg);

    // 8. 繪製建造模式的預覽游標
    const mousePos = this.inputHandler.getMousePos();
    this.drawPlacementPreview(mousePos.x, mousePos.y);
  }
}
