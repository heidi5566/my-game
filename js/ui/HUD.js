import { CONFIG } from '../config.js';

/**
 * HUD 與 UI 全域管理器 (Heads-Up Display & UI Manager)
 * 負責主選單、關卡選擇、角色選擇、寵物圖鑑與遊戲結算介面
 */
export class HUD {
  constructor() {
    // 畫面容器
    this.mainMenu = document.getElementById('mainMenu');
    this.gameScreen = document.getElementById('gameScreen');

    // 主選單按鈕與統計
    this.menuLevelBtn = document.getElementById('menuLevelBtn');
    this.menuCharBtn = document.getElementById('menuCharBtn');
    this.menuPetBtn = document.getElementById('menuPetBtn');
    this.statsUnlockedLevel = document.getElementById('statsUnlockedLevel');
    this.statsCurrentChar = document.getElementById('statsCurrentChar');
    this.statsCurrentPet = document.getElementById('statsCurrentPet');

    // 彈窗容器
    this.levelModal = document.getElementById('levelModal');
    this.charModal = document.getElementById('charModal');
    this.petModal = document.getElementById('petModal');
    this.levelGrid = document.getElementById('levelGrid');
    this.charGrid = document.getElementById('charGrid');
    this.petGrid = document.getElementById('petGrid');

    // 戰鬥 HUD
    this.waveDisplay = document.getElementById('waveDisplay');
    this.maxWaveDisplay = document.getElementById('maxWaveDisplay');
    this.goldDisplay = document.getElementById('goldDisplay');
    this.livesDisplay = document.getElementById('livesDisplay');
    this.killDisplay = document.getElementById('killDisplay');
    this.charHudName = document.getElementById('charHudName');
    this.currentLevelBadge = document.getElementById('currentLevelBadge');
    this.backToMenuBtn = document.getElementById('backToMenuBtn');

    // 戰鬥控制按鈕
    this.startWaveBtn = document.getElementById('startWaveBtn');
    this.placeTowerBtn = document.getElementById('placeTowerBtn');
    this.upgradeBtn = document.getElementById('upgradeBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.soundBtn = document.getElementById('soundBtn');
    this.musicBtn = document.getElementById('musicBtn');
    this.speedBtn = document.getElementById('speedBtn');
    this.placeMsg = document.getElementById('placeMsg');

    // 結算彈窗與更換角色/寵物狀態追蹤
    this.overlay = document.getElementById('overlay');
    this.overTitle = document.getElementById('overTitle');
    this.overText = document.getElementById('overText');
    this.overNextLevel = document.getElementById('overNextLevel');
    this.overChangeChar = document.getElementById('overChangeChar');
    this.overChangePet = document.getElementById('overChangePet');
    this.overRestart = document.getElementById('overRestart');
    this.overMenuBtn = document.getElementById('overMenuBtn');
    this.overlayPendingReturn = false;

    // 載入遮罩
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingText = document.getElementById('loadingText');
    this.msgTimer = null;

    this.initModalCloseEvents();
  }

  /**
   * 初始化彈窗關閉按鈕事件
   */
  initModalCloseEvents() {
    const closeLevel = document.getElementById('closeLevelModal');
    const closeChar = document.getElementById('closeCharModal');
    const closePet = document.getElementById('closePetModal');
    const doneChar = document.getElementById('doneCharModal');
    const donePet = document.getElementById('donePetModal');

    if (closeLevel) closeLevel.addEventListener('click', () => this.closeModals());
    if (closeChar) closeChar.addEventListener('click', () => this.closeModals());
    if (closePet) closePet.addEventListener('click', () => this.closeModals());
    if (doneChar) doneChar.addEventListener('click', () => this.closeModals());
    if (donePet) donePet.addEventListener('click', () => this.closeModals());

    // 點擊背景遮罩關閉
    [this.levelModal, this.charModal, this.petModal].forEach((modal) => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModals();
        });
      }
    });
  }

  /**
   * 切換主畫面或戰鬥畫面
   */
  showScreen(screen) {
    this.overlayPendingReturn = false;
    this.closeModals();
    if (screen === 'menu') {
      if (this.mainMenu) this.mainMenu.classList.add('active');
      if (this.gameScreen) this.gameScreen.classList.remove('active');
    } else if (screen === 'game') {
      if (this.mainMenu) this.mainMenu.classList.remove('active');
      if (this.gameScreen) this.gameScreen.classList.add('active');
    }
  }

  closeModals() {
    if (this.levelModal) this.levelModal.classList.remove('active');
    if (this.charModal) this.charModal.classList.remove('active');
    if (this.petModal) this.petModal.classList.remove('active');

    // 若是從結算介面（大勝利/戰敗）點擊更換角色/寵物，關閉彈窗後自動復原結算介面
    if (this.overlayPendingReturn) {
      this.overlayPendingReturn = false;
      if (this.overlay) {
        this.overlay.style.display = 'flex';
      }
    }
  }

  openModal(modal) {
    this.closeModals();
    if (modal) modal.classList.add('active');
  }

  /**
   * 更新主選單狀態看板
   */
  updateMenuStats(unlockedLevel, currentCharName, currentPetName) {
    if (this.statsUnlockedLevel) this.statsUnlockedLevel.textContent = `第 ${unlockedLevel} 關`;
    if (this.statsCurrentChar) this.statsCurrentChar.textContent = currentCharName;
    if (this.statsCurrentPet) this.statsCurrentPet.textContent = currentPetName || '無';
  }

  /**
   * 渲染關卡選擇卡片清單
   */
  renderLevelGrid(unlockedMax, currentLevelId, onSelectLevel) {
    if (!this.levelGrid) return;
    this.levelGrid.innerHTML = '';

    CONFIG.LEVELS.forEach((lvl) => {
      const isUnlocked = lvl.id <= unlockedMax;
      const card = document.createElement('div');
      card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="level-title">${lvl.name} ${isUnlocked ? '🔓' : '🔒'}</div>
        <div class="level-desc">${lvl.desc}</div>
        <div class="level-waves">波次總數：${lvl.waves} 波</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.closeModals();
          if (onSelectLevel) onSelectLevel(lvl.id);
        });
      }
      this.levelGrid.appendChild(card);
    });
  }

  /**
   * 渲染角色選擇清單
   */
  renderCharGrid(selectedCharId, onSelectChar) {
    if (!this.charGrid) return;
    this.charGrid.innerHTML = '';

    CONFIG.CHARACTERS.forEach((char) => {
      const isSelected = char.id === selectedCharId;
      const card = document.createElement('div');
      card.className = `char-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="char-name">${char.name} ${isSelected ? '✓' : ''}</div>
        <div class="char-desc">${char.desc}</div>
        <button class="${isSelected ? 'secondary' : 'ghost'} mini-btn">${isSelected ? '已裝備' : '選擇'}</button>
      `;

      card.addEventListener('click', () => {
        if (onSelectChar) onSelectChar(char.id);
        this.renderCharGrid(char.id, onSelectChar);
      });
      this.charGrid.appendChild(card);
    });
  }

  /**
   * 渲染寵物圖鑑與裝備清單
   */
  renderPetGrid(unlockedMax, selectedPetId, onSelectPet) {
    if (!this.petGrid) return;
    this.petGrid.innerHTML = '';

    CONFIG.PETS.forEach((pet) => {
      const isUnlocked = unlockedMax >= pet.unlockLevel;
      const isEquipped = pet.id === selectedPetId;
      const card = document.createElement('div');
      card.className = `pet-card ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}`;
      card.innerHTML = `
        <div class="pet-name">${pet.name} ${isUnlocked ? (isEquipped ? '★ 已上陣' : '🔓') : '🔒'}</div>
        <div class="pet-desc">${pet.desc}</div>
        <button class="${isEquipped ? 'secondary' : 'ghost'} mini-btn" ${!isUnlocked ? 'disabled' : ''}>
          ${isEquipped ? '已上陣' : isUnlocked ? '上陣此寵物' : `需通關第 ${pet.unlockLevel} 關`}
        </button>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          const nextPet = isEquipped ? null : pet.id;
          if (onSelectPet) onSelectPet(nextPet);
          this.renderPetGrid(unlockedMax, nextPet, onSelectPet);
        });
      }
      this.petGrid.appendChild(card);
    });
  }

  /**
   * 綁定主選單與所有操作事件
   */
  bindEvents({
    onOpenLevelModal,
    onOpenCharModal,
    onOpenPetModal,
    onBackToMenu,
    onStartWave,
    onTogglePlace,
    onUpgrade,
    onRestart,
    onNextLevel,
    onToggleSound,
    onToggleMusic,
    onToggleSpeed,
    onChangeCharInOverlay,
    onChangePetInOverlay
  }) {
    if (this.menuLevelBtn && onOpenLevelModal) {
      this.menuLevelBtn.addEventListener('click', onOpenLevelModal);
    }
    if (this.menuCharBtn && onOpenCharModal) {
      this.menuCharBtn.addEventListener('click', onOpenCharModal);
    }
    if (this.menuPetBtn && onOpenPetModal) {
      this.menuPetBtn.addEventListener('click', onOpenPetModal);
    }
    if (this.backToMenuBtn && onBackToMenu) {
      this.backToMenuBtn.addEventListener('click', onBackToMenu);
    }
    if (this.overMenuBtn && onBackToMenu) {
      this.overMenuBtn.addEventListener('click', () => {
        this.hideOverlay();
        onBackToMenu();
      });
    }

    if (this.startWaveBtn && onStartWave) {
      this.startWaveBtn.addEventListener('click', onStartWave);
    }
    if (this.speedBtn && onToggleSpeed) {
      this.speedBtn.addEventListener('click', onToggleSpeed);
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
      this.overRestart.addEventListener('click', () => {
        this.overlayPendingReturn = false;
        this.hideOverlay();
        onRestart();
      });
    }
    if (this.overNextLevel && onNextLevel) {
      this.overNextLevel.addEventListener('click', () => {
        this.overlayPendingReturn = false;
        this.hideOverlay();
        onNextLevel();
      });
    }
    if (this.overChangeChar && onChangeCharInOverlay) {
      this.overChangeChar.addEventListener('click', () => {
        this.overlayPendingReturn = true;
        this.hideOverlay();
        onChangeCharInOverlay();
      });
    }
    if (this.overChangePet && onChangePetInOverlay) {
      this.overChangePet.addEventListener('click', () => {
        this.overlayPendingReturn = true;
        this.hideOverlay();
        onChangePetInOverlay();
      });
    }

    // 音訊開關 (僅保留下方控制按鈕)
    if (onToggleSound && this.soundBtn) {
      this.soundBtn.addEventListener('click', onToggleSound);
    }
    if (onToggleMusic && this.musicBtn) {
      this.musicBtn.addEventListener('click', onToggleMusic);
    }
  }

  /**
   * 設定遊戲倍速按鈕外觀狀態
   * @param {number} currentSpeed - 當前行進倍速 (1.0, 1.5, 2.0)
   * @param {number} maxUnlockedSpeed - 已解鎖的最高倍速 (1.0, 1.5, 2.0)
   */
  setSpeedState(currentSpeed = 1.0, maxUnlockedSpeed = 1.0) {
    if (!this.speedBtn) return;
    const speedStr = `${currentSpeed.toFixed(1)}x`;
    let subStr = '';

    if (maxUnlockedSpeed >= 2.0) {
      if (currentSpeed >= 2.0) {
        subStr = '已達極速 (點擊循環)';
      } else if (currentSpeed >= 1.5) {
        subStr = '切換 2.0x';
      } else {
        subStr = '切換 1.5x';
      }
    } else if (maxUnlockedSpeed >= 1.5) {
      if (currentSpeed >= 1.5) {
        subStr = '升級 2.0x 需 50 金';
      } else {
        subStr = '切換 1.5x (已解鎖)';
      }
    } else {
      subStr = '升級 1.5x 需 40 金';
    }

    this.speedBtn.innerHTML = `
      <span class="speed-main">速度 ${speedStr}</span>
      <span class="speed-sub">${subStr}</span>
    `;
    this.speedBtn.className = 'accent-btn speed-btn';
    this.speedBtn.disabled = false;
  }

  /**
   * 更新戰鬥 HUD 數據
   */
  updateHUD({ wave, maxWaves, gold, lives, kills, selectedTower, towerCount, currentLevel, charName }) {
    if (this.waveDisplay) this.waveDisplay.textContent = wave;
    if (this.maxWaveDisplay) this.maxWaveDisplay.textContent = maxWaves;
    if (this.goldDisplay) this.goldDisplay.textContent = gold;
    if (this.livesDisplay) this.livesDisplay.textContent = lives;
    if (this.killDisplay) this.killDisplay.textContent = kills;
    if (this.charHudName && charName) this.charHudName.textContent = charName;
    if (this.currentLevelBadge && currentLevel) {
      this.currentLevelBadge.textContent = currentLevel.name;
    }

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

  setStartWaveDisabled(disabled) {
    if (this.startWaveBtn) {
      this.startWaveBtn.disabled = disabled;
    }
  }

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

  setSoundState(soundOn) {
    const text = soundOn ? '🔊 音效開' : '🔇 音效關';
    if (this.soundBtn) this.soundBtn.textContent = text;
  }

  setMusicState(musicOn) {
    const text = musicOn ? '🎵 音樂開' : '🎵 音樂關';
    if (this.musicBtn) this.musicBtn.textContent = text;
  }

  showLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'flex';
    }
  }

  updateLoadingProgress(loaded, total) {
    if (this.loadingText) {
      const pct = total > 0 ? Math.round((loaded / total) * 100) : 100;
      this.loadingText.textContent = `資源載入中... ${pct}%`;
    }
  }

  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    }
  }

  /**
   * 顯示遊戲結束或過關勝利結算
   */
  showOverlay(win, wave, kills, hasNextLevel = false, petUnlockedMsg = '') {
    if (!this.overlay) return;
    this.overlayPendingReturn = false;
    this.overlay.style.display = 'flex';
    if (this.overTitle) {
      this.overTitle.textContent = win ? '🎉 關卡大勝利！' : '💥 戰敗結束';
    }
    if (this.overText) {
      if (win) {
        this.overText.textContent = `恭喜防守成功！共擊殺 ${kills} 隻敵人。${petUnlockedMsg ? '\n✨ ' + petUnlockedMsg : ''}`;
      } else {
        this.overText.textContent = `你撐到了第 ${wave} 波，基地被攻破了。請再接再厲！`;
      }
    }

    if (this.overNextLevel) {
      this.overNextLevel.style.display = win && hasNextLevel ? 'inline-block' : 'none';
    }
  }

  hideOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }
}
