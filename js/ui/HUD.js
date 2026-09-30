import { CONFIG } from '../config.js';

/**
 * HUD 使用者介面管理器 (Heads-Up Display Manager)
 * 負責資料綁定、控制按鈕交互狀態、音效/音樂雙控制以及 Game Over 結算彈窗
 */
export class HUD {
  constructor() {
    this.waveDisplay = document.getElementById('waveDisplay');
    this.goldDisplay = document.getElementById('goldDisplay');
    this.livesDisplay = document.getElementById('livesDisplay');
    this.killDisplay = document.getElementById('killDisplay');
    this.startWaveBtn = document.getElementById('startWaveBtn');
    this.placeTowerBtn = document.getElementById('placeTowerBtn');
    this.upgradeBtn = document.getElementById('upgradeBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.soundBtn = document.getElementById('soundBtn');
    this.musicBtn = document.getElementById('musicBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.musicToggleBtn = document.getElementById('musicToggleBtn');
    this.placeMsg = document.getElementById('placeMsg');
    this.overlay = document.getElementById('overlay');
    this.overTitle = document.getElementById('overTitle');
    this.overText = document.getElementById('overText');
    this.overRestart = document.getElementById('overRestart');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingText = document.getElementById('loadingText');
    this.msgTimer = null;
  }

  /**
   * 綁定按鈕事件處理器
   */
  bindEvents({ onStartWave, onTogglePlace, onUpgrade, onRestart, onToggleSound, onToggleMusic }) {
    if (this.startWaveBtn && onStartWave) {
      this.startWaveBtn.addEventListener('click', onStartWave);
    }
    if (this.placeTowerBtn && onTogglePlace) {
      this.placeTowerBtn.addEventListener('click', onTogglePlace);
    }
    if (this.upgradeBtn && onUpgrade) {
      this.upgradeBtn.addEventListener('click', onUpgrade);
    }
    if (this.restartBtn && onRestart) {
      this.restartBtn.addEventListener('click', onRestart);
    }
    if (this.overRestart && onRestart) {
      this.overRestart.addEventListener('click', onRestart);
    }

    // 音效按鈕綁定（支援底部與右上角雙按鈕）
    if (onToggleSound) {
      if (this.soundBtn) this.soundBtn.addEventListener('click', onToggleSound);
      if (this.soundToggleBtn) this.soundToggleBtn.addEventListener('click', onToggleSound);
    }

    // 音樂按鈕綁定（支援底部與右上角雙按鈕）
    if (onToggleMusic) {
      if (this.musicBtn) this.musicBtn.addEventListener('click', onToggleMusic);
      if (this.musicToggleBtn) this.musicToggleBtn.addEventListener('click', onToggleMusic);
    }
  }

  /**
   * 更新 HUD 數據與按鈕可用狀態
   */
  update({ wave, gold, lives, kills, selectedTower, towerCount }) {
    if (this.waveDisplay) this.waveDisplay.textContent = wave;
    if (this.goldDisplay) this.goldDisplay.textContent = gold;
    if (this.livesDisplay) this.livesDisplay.textContent = lives;
    if (this.killDisplay) this.killDisplay.textContent = kills;

    if (this.upgradeBtn) {
      this.upgradeBtn.disabled = !selectedTower || gold < CONFIG.TOWER.UPGRADE_COST;
    }

    if (this.placeTowerBtn) {
      const isMax = towerCount >= CONFIG.TOWER.MAX_COUNT;
      this.placeTowerBtn.disabled = gold < CONFIG.TOWER.NEW_COST || isMax;
      this.placeTowerBtn.textContent = isMax
        ? `砲塔已達上限 (${CONFIG.TOWER.MAX_COUNT})`
        : `放置新砲塔 (${CONFIG.TOWER.NEW_COST}金)`;
    }
  }

  /**
   * 設定波次按鈕禁用狀態
   */
  setStartWaveDisabled(disabled) {
    if (this.startWaveBtn) {
      this.startWaveBtn.disabled = disabled;
    }
  }

  /**
   * 顯示提示文字
   */
  showMessage(msg, duration = 0) {
    if (!this.placeMsg) return;
    this.placeMsg.textContent = msg;

    if (this.msgTimer) {
      clearTimeout(this.msgTimer);
      this.msgTimer = null;
    }

    if (duration > 0) {
      this.msgTimer = setTimeout(() => {
        this.placeMsg.textContent = '';
      }, duration);
    }
  }

  /**
   * 切換音效按鈕外觀文字
   */
  setSoundState(soundOn) {
    const text = soundOn ? '🔊 音效開' : '🔇 音效關';
    if (this.soundBtn) this.soundBtn.textContent = text;
    if (this.soundToggleBtn) this.soundToggleBtn.textContent = text;
  }

  /**
   * 切換背景音樂按鈕外觀文字
   */
  setMusicState(musicOn) {
    const text = musicOn ? '🎵 音樂開' : '🎵 音樂關';
    if (this.musicBtn) this.musicBtn.textContent = text;
    if (this.musicToggleBtn) this.musicToggleBtn.textContent = text;
  }

  /**
   * 顯示載入中遮罩
   */
  showLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'flex';
    }
  }

  /**
   * 更新載入進度文字
   */
  updateLoadingProgress(loaded, total) {
    if (this.loadingText) {
      const pct = total > 0 ? Math.round((loaded / total) * 100) : 100;
      this.loadingText.textContent = `資源載入中... ${pct}%`;
    }
  }

  /**
   * 隱藏載入遮罩
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    }
  }

  /**
   * 顯示遊戲結束或勝利彈窗
   */
  showOverlay(win, wave, kills) {
    if (!this.overlay) return;
    this.overlay.style.display = 'flex';
    if (this.overTitle) {
      this.overTitle.textContent = win ? '🎉 勝利！' : '💥 遊戲結束';
    }
    if (this.overText) {
      this.overText.textContent = win
        ? '你成功守住了所有波次！'
        : `你撐到了第 ${wave} 波，共擊殺 ${kills} 隻敵人。`;
    }
  }

  /**
   * 隱藏結算彈窗
   */
  hideOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }
}
