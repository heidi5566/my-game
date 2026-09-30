import { Game } from './core/Game.js';

/**
 * 應用程式啟動進入點 (Main Entry Point)
 */
window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game('game');
    game.start();
    console.log('[GameEngine] 塔防遊戲引擎初始化成功，遊戲循環已啟動。');
  } catch (error) {
    console.error('[GameEngine] 遊戲初始化失敗:', error);
  }
});
