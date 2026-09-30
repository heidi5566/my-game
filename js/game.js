// 遊戲主循環與狀態管理：波次進度、戰鬥演算、計分與勝負狀態

import {
  PATH,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAX_TOWERS,
  NEW_TOWER_COST,
  TOWER_UPGRADE_COST,
  INITIAL_GOLD,
  INITIAL_LIVES,
  INITIAL_WAVE,
  pointDist
} from './config.js';

import { createEnemy, moveEnemy, drawEnemies } from './enemy.js';

import {
  makeTower,
  isValidPlacement,
  updateTowers,
  drawTowers,
  drawPlacementPreview,
  fireBullet,
  updateBullets,
  drawBullets,
  spawnExplosion,
  updateParticles,
  drawParticles,
  playPlace,
  ensureAudio
} from './player.js';

export class Game {
  constructor(canvas, uiCallbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = uiCallbacks; // 包含 onHUDUpdate, onGameOver, onPlaceMessage 等 UI 觸發回呼

    this.width = CANVAS_WIDTH;
    this.height = CANVAS_HEIGHT;

    this.reset();
  }

  reset() {
    this.gold = INITIAL_GOLD;
    this.lives = INITIAL_LIVES;
    this.wave = INITIAL_WAVE;
    this.kills = 0;

    this.waveActive = false;
    this.spawnQueue = 0;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.lastTime = 0;

    this.towers = [makeTower(350, 150)];
    this.selectedTower = this.towers[0];
    this.placingMode = false;

    this.enemies = [];
    this.bullets = [];
    this.particles = [];

    this.lastMouse = { x: null, y: null };

    if (this.ui.onHUDUpdate) this.ui.onHUDUpdate(this.getHUDState());
  }

  getHUDState() {
    return {
      wave: this.wave,
      gold: this.gold,
      lives: this.lives,
      kills: this.kills,
      selectedTower: this.selectedTower,
      towerCount: this.towers.length,
      maxTowers: MAX_TOWERS,
      newTowerCost: NEW_TOWER_COST,
      upgradeCost: TOWER_UPGRADE_COST,
      placingMode: this.placingMode,
      waveActive: this.waveActive,
      gameOver: this.gameOver
    };
  }

  notifyHUD() {
    if (this.ui.onHUDUpdate) {
      this.ui.onHUDUpdate(this.getHUDState());
    }
  }

  startWave() {
    ensureAudio();
    if (this.waveActive || this.gameOver) return;
    this.waveActive = true;
    this.spawnQueue = 5 + this.wave * 2;
    this.spawnTimer = 0;
    this.notifyHUD();
  }

  checkWaveEnd() {
    if (this.waveActive && this.spawnQueue <= 0 && this.enemies.every(e => e.dead)) {
      this.waveActive = false;
      this.enemies = [];
      this.wave += 1;
      this.gold += 15;
      this.notifyHUD();
    }
  }

  endGame(win) {
    this.gameOver = true;
    if (this.ui.onGameOver) {
      this.ui.onGameOver({
        win,
        wave: this.wave,
        kills: this.kills
      });
    }
    this.notifyHUD();
  }

  togglePlaceMode() {
    ensureAudio();
    if (this.gold < NEW_TOWER_COST || this.towers.length >= MAX_TOWERS) return;
    this.placingMode = !this.placingMode;
    this.canvas.classList.toggle('placing', this.placingMode);

    if (this.ui.onPlaceMessage) {
      this.ui.onPlaceMessage(
        this.placingMode ? '請點擊畫面空地放置新砲塔（不可太靠近路徑）' : ''
      );
    }
    this.notifyHUD();
  }

  upgradeSelectedTower() {
    ensureAudio();
    if (this.selectedTower && this.gold >= TOWER_UPGRADE_COST) {
      this.gold -= TOWER_UPGRADE_COST;
      this.selectedTower.level += 1;
      this.selectedTower.damage += 8;
      this.selectedTower.range += 12;
      this.selectedTower.fireRate = Math.max(150, this.selectedTower.fireRate - 40);
      this.notifyHUD();
    }
  }

  handleCanvasClick(pos) {
    ensureAudio();
    if (this.gameOver) return;

    if (this.placingMode) {
      if (this.gold < NEW_TOWER_COST) {
        if (this.ui.onPlaceMessage) this.ui.onPlaceMessage('金幣不足，無法放置砲塔');
        return;
      }
      if (!isValidPlacement(pos.x, pos.y, this.towers, this.width, this.height)) {
        if (this.ui.onPlaceMessage) {
          this.ui.onPlaceMessage('此位置太靠近路徑或其他砲塔，請換個地方');
        }
        return;
      }

      this.gold -= NEW_TOWER_COST;
      const t = makeTower(pos.x, pos.y);
      this.towers.push(t);
      this.selectedTower = t;
      this.placingMode = false;
      this.canvas.classList.remove('placing');
      if (this.ui.onPlaceMessage) {
        this.ui.onPlaceMessage('新砲塔已成功部署！');
        setTimeout(() => {
          if (this.ui.onPlaceMessage) this.ui.onPlaceMessage('');
        }, 1800);
      }
      playPlace();
      this.notifyHUD();
      return;
    }

    // 選取砲塔
    let clicked = null;
    for (const t of this.towers) {
      const r = 19 + t.level * 1.8 + 5;
      if (pointDist(pos.x, pos.y, t.x, t.y) <= r) {
        clicked = t;
        break;
      }
    }
    if (clicked) {
      this.selectedTower = clicked;
      this.notifyHUD();
    }
  }

  drawPath() {
    const ctx = this.ctx;
    ctx.strokeStyle = '#2d3b4a';
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke();

    ctx.strokeStyle = '#3d4f61';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  update(dt, now) {
    if (this.gameOver) return;

    // 波次生成敵人
    if (this.waveActive) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.spawnQueue > 0) {
        this.enemies.push(createEnemy(this.wave, PATH));
        this.spawnQueue -= 1;
        this.spawnTimer = 0.7;
      }
    }

    // 移動敵人
    for (const e of this.enemies) {
      if (!e.dead) {
        moveEnemy(e, dt, PATH, () => {
          this.lives -= 1;
          if (this.lives <= 0) {
            this.endGame(false);
          }
        });
      }
    }

    // 砲塔瞄準與開火
    updateTowers(this.towers, this.enemies, dt, now, (t, target, damage) => {
      fireBullet(this.bullets, t, target, damage);
    });

    // 砲彈飛行與擊中判斷
    this.bullets = updateBullets(
      this.bullets,
      dt,
      (hx, hy) => {
        this.particles.push({ type: 'hit', x: hx, y: hy, life: 0.15, maxLife: 0.15 });
      },
      (target) => {
        this.gold += target.reward;
        this.kills += 1;
        spawnExplosion(this.particles, target.x, target.y);
      }
    );

    // 粒子運算
    this.particles = updateParticles(this.particles, dt);

    // 波次結束檢核
    this.checkWaveEnd();
    this.notifyHUD();
  }

  render(now) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawPath();
    drawTowers(this.ctx, this.towers, this.selectedTower);
    drawBullets(this.ctx, this.bullets);
    drawEnemies(this.ctx, this.enemies, now);
    drawParticles(this.ctx, this.particles);

    if (this.placingMode && this.lastMouse.x !== null) {
      const valid = isValidPlacement(
        this.lastMouse.x,
        this.lastMouse.y,
        this.towers,
        this.width,
        this.height
      );
      drawPlacementPreview(this.ctx, this.lastMouse.x, this.lastMouse.y, valid);
    }
  }

  start() {
    const loop = (now) => {
      if (!this.lastTime) this.lastTime = now;
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      this.update(dt, now);
      this.render(now);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
