/**
 * 遊戲全域設定與數值配置 (Game Configuration)
 */
export const CONFIG = {
  // 畫布規格
  CANVAS_WIDTH: 640,
  CANVAS_HEIGHT: 420,

  // 防守路徑（凹字型 6 點折線座標）
  PATH: [
    { x: -20, y: 60 },
    { x: 150, y: 60 },
    { x: 150, y: 220 },
    { x: 400, y: 220 },
    { x: 400, y: 80 },
    { x: 660, y: 80 }
  ],
  PATH_CLEARANCE: 34, // 砲塔與路徑最小安全距離

  // 砲塔系統設定
  TOWER: {
    MAX_COUNT: 3,
    NEW_COST: 40,
    UPGRADE_COST: 20,
    MIN_GAP: 55, // 砲塔彼此間距
    DEFAULT_RANGE: 130,
    DEFAULT_DAMAGE: 12,
    DEFAULT_FIRE_RATE: 550, // 毫秒
    DEFAULT_ANGLE: -Math.PI / 2,
    UPGRADE_DAMAGE: 8,
    UPGRADE_RANGE: 12,
    UPGRADE_FIRE_RATE_REDUCTION: 40,
    MIN_FIRE_RATE: 150,
    INITIAL_POSITION: { x: 350, y: 150 }
  },

  // 玩家初始資源
  PLAYER: {
    INITIAL_GOLD: 50,
    INITIAL_LIVES: 10,
    INITIAL_WAVE: 1,
    WAVE_CLEAR_REWARD: 15
  },

  // 子彈數值
  BULLET: {
    SPEED: 340,
    RADIUS: 4
  },

  // 敵人數值計算公式
  ENEMY: {
    SPAWN_INTERVAL: 0.7, // 秒
    getQueueCount: (wave) => 5 + wave * 2,
    getBaseHp: (wave) => 30 + (wave - 1) * 12,
    getSpeed: (wave) => 45 + (wave - 1) * 3,
    getReward: (wave) => 5 + Math.floor(wave / 2)
  },

  // 視覺顏色配置
  COLORS: {
    BG: '#0f1720',
    PANEL: '#1b2733',
    ACCENT: '#4fd1c5',
    ACCENT2: '#f6ad55',
    DANGER: '#f56565',
    TEXT: '#e2e8f0',
    GRID: '#ffffff',
    PATH_LINE: '#2d3b4a',
    PATH_DASH: '#3d4f61',
    BULLET: '#e08e2c',
    BULLET_STROKE: '#8a5a12'
  }
};
