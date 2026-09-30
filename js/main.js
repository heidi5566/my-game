// 遊戲啟動入口：DOM 元件取得、事件綁定與初始化

import { Game } from './game.js';
import { toggleSound, isSoundOn, ensureAudio } from './player.js';

// DOM 元素取得
const canvas = document.getElementById('game');
const waveDisplay = document.getElementById('waveDisplay');
const goldDisplay = document.getElementById('goldDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const killDisplay = document.getElementById('killDisplay');

const startWaveBtn = document.getElementById('startWaveBtn');
const placeTowerBtn = document.getElementById('placeTowerBtn');
const upgradeBtn = document.getElementById('upgradeBtn');
const restartBtn = document.getElementById('restartBtn');
const soundBtn = document.getElementById('soundBtn');

const placeMsg = document.getElementById('placeMsg');
const overlay = document.getElementById('overlay');
const overTitle = document.getElementById('overTitle');
const overText = document.getElementById('overText');
const overRestart = document.getElementById('overRestart');

/**
 * 畫布座標轉換工具（支援 RWD 縮放與觸控）
 */
function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

// 建立 Game 實例並注入 UI 回呼
const game = new Game(canvas, {
  onHUDUpdate(state) {
    waveDisplay.textContent = state.wave;
    goldDisplay.textContent = state.gold;
    livesDisplay.textContent = state.lives;
    killDisplay.textContent = state.kills;

    upgradeBtn.disabled = !state.selectedTower || state.gold < state.upgradeCost;
    placeTowerBtn.disabled =
      state.gold < state.newTowerCost || state.towerCount >= state.maxTowers;
    placeTowerBtn.textContent =
      state.towerCount >= state.maxTowers
        ? `砲塔已達上限 (${state.maxTowers})`
        : `放置新砲塔 (${state.newTowerCost}金)`;
    startWaveBtn.disabled = state.waveActive || state.gameOver;
  },

  onGameOver({ win, wave, kills }) {
    overlay.style.display = 'flex';
    overTitle.textContent = win ? '🎉 勝利！' : '💥 遊戲結束';
    overText.textContent = win
      ? '你成功守住了所有波次！'
      : `你撐到了第 ${wave} 波，共擊殺 ${kills} 隻敵人。`;
  },

  onPlaceMessage(msg) {
    placeMsg.textContent = msg;
  }
});

// 滑鼠/觸控事件
canvas.addEventListener('mousemove', (evt) => {
  game.lastMouse = getCanvasPos(evt);
});

canvas.addEventListener('mouseleave', () => {
  game.lastMouse = { x: null, y: null };
});

canvas.addEventListener('click', (evt) => {
  const pos = getCanvasPos(evt);
  game.handleCanvasClick(pos);
});

// 控制按鈕事件
startWaveBtn.addEventListener('click', () => {
  game.startWave();
});

placeTowerBtn.addEventListener('click', () => {
  game.togglePlaceMode();
});

upgradeBtn.addEventListener('click', () => {
  game.upgradeSelectedTower();
});

soundBtn.addEventListener('click', () => {
  const on = toggleSound();
  soundBtn.textContent = on ? '🔊 音效開' : '🔇 音效關';
});

function handleReset() {
  overlay.style.display = 'none';
  placeMsg.textContent = '';
  canvas.classList.remove('placing');
  startWaveBtn.disabled = false;
  game.reset();
}

restartBtn.addEventListener('click', () => {
  ensureAudio();
  handleReset();
});

overRestart.addEventListener('click', () => {
  ensureAudio();
  handleReset();
});

// 啟動主循環
game.start();
