/**
 * 遊戲全域設定與數值配置 (Game Configuration)
 */
export const CONFIG = {
  // 畫布規格
  CANVAS_WIDTH: 640,
  CANVAS_HEIGHT: 420,

  // 關卡配置清單 (Levels 1 to 12 - 一關一種專屬魔物)
  LEVELS: [
    {
      id: 1,
      name: '第 1 關：初試啼聲',
      desc: '經典 S 型防線。敵方魔物：【獨眼暴龍兵】',
      enemyType: 'mon1',
      waves: 5,
      path: [
        { x: -20, y: 60 },
        { x: 150, y: 60 },
        { x: 150, y: 220 },
        { x: 400, y: 220 },
        { x: 400, y: 80 },
        { x: 660, y: 80 }
      ],
      initialTower: { x: 350, y: 150 },
      commanderPos: { x: 610, y: 80 },
      bgImage: './assets/images/bg_level_1.png'
    },
    {
      id: 2,
      name: '第 2 關：迴旋走廊',
      desc: 'U 型大迂迴長廊。敵方魔物：【骷髏幽靈兵】（過關解鎖神寵：熾焰火靈鳥）',
      enemyType: 'mon2',
      waves: 5,
      path: [
        { x: -20, y: 320 },
        { x: 240, y: 320 },
        { x: 240, y: 100 },
        { x: 480, y: 100 },
        { x: 480, y: 320 },
        { x: 660, y: 320 }
      ],
      initialTower: { x: 360, y: 210 },
      commanderPos: { x: 610, y: 320 },
      bgImage: './assets/images/bg_level_2.png'
    },
    {
      id: 3,
      name: '第 3 關：迷宮重圍',
      desc: '雙折曲折縱深防線。敵方魔物：【吐舌翼蝠怪】',
      enemyType: 'mon3',
      waves: 6,
      path: [
        { x: -20, y: 80 },
        { x: 160, y: 80 },
        { x: 160, y: 340 },
        { x: 340, y: 340 },
        { x: 340, y: 80 },
        { x: 520, y: 80 },
        { x: 520, y: 340 },
        { x: 660, y: 340 }
      ],
      initialTower: { x: 250, y: 210 },
      commanderPos: { x: 610, y: 340 },
      bgImage: './assets/images/bg_level_3.png'
    },
    {
      id: 4,
      name: '第 4 關：幽魂深淵',
      desc: '大外環迴旋線路。敵方魔物：【Skulli 幽魂魅影】（過關解鎖神寵：蒼穹疾風鳥）',
      enemyType: 'skulli',
      waves: 6,
      path: [
        { x: -20, y: 340 },
        { x: 120, y: 340 },
        { x: 120, y: 80 },
        { x: 520, y: 80 },
        { x: 520, y: 260 },
        { x: 280, y: 260 },
        { x: 280, y: 180 },
        { x: 660, y: 180 }
      ],
      initialTower: { x: 340, y: 130 },
      commanderPos: { x: 610, y: 180 },
      bgImage: './assets/images/bg_level_4.png'
    },
    {
      id: 5,
      name: '第 5 關：魔導突襲',
      desc: '波浪蛇形突圍線。敵方魔物：【暗黑秘術魔導士】',
      enemyType: 'mage',
      waves: 7,
      path: [
        { x: -20, y: 100 },
        { x: 140, y: 100 },
        { x: 140, y: 260 },
        { x: 280, y: 260 },
        { x: 280, y: 100 },
        { x: 420, y: 100 },
        { x: 420, y: 260 },
        { x: 560, y: 260 },
        { x: 560, y: 100 },
        { x: 660, y: 100 }
      ],
      initialTower: { x: 210, y: 180 },
      commanderPos: { x: 610, y: 100 },
      bgImage: './assets/images/bg_level_5.png'
    },
    {
      id: 6,
      name: '第 6 關：地岩試煉',
      desc: '螺旋迴轉大迷宮。敵方魔物：【尖刺大地岩獸】（過關解鎖神寵：幻彩極光鳥）',
      enemyType: 'spiky',
      waves: 8,
      path: [
        { x: -20, y: 60 },
        { x: 540, y: 60 },
        { x: 540, y: 340 },
        { x: 120, y: 340 },
        { x: 120, y: 180 },
        { x: 400, y: 180 },
        { x: 400, y: 260 },
        { x: 660, y: 260 }
      ],
      initialTower: { x: 260, y: 260 },
      commanderPos: { x: 610, y: 260 },
      bgImage: './assets/images/bg_level_6.png'
    },
    {
      id: 7,
      name: '第 7 關：階梯重陣',
      desc: '高低階梯突進防線。敵方魔物：【綠皮半獸人蠻兵】',
      enemyType: 'orc',
      waves: 6,
      path: [
        { x: -20, y: 340 },
        { x: 150, y: 340 },
        { x: 150, y: 240 },
        { x: 300, y: 240 },
        { x: 300, y: 140 },
        { x: 460, y: 140 },
        { x: 460, y: 60 },
        { x: 660, y: 60 }
      ],
      initialTower: { x: 380, y: 200 },
      commanderPos: { x: 610, y: 60 },
      bgImage: './assets/images/bg_level_7.png'
    },
    {
      id: 8,
      name: '第 8 關：峽谷雙折',
      desc: '深谷折返大迂迴。敵方魔物：【星際裝甲巡航兵】（過關解鎖神寵：未來光能鳥）',
      enemyType: 'spaceman',
      waves: 7,
      path: [
        { x: -20, y: 80 },
        { x: 220, y: 80 },
        { x: 220, y: 280 },
        { x: 80, y: 280 },
        { x: 80, y: 350 },
        { x: 540, y: 350 },
        { x: 540, y: 160 },
        { x: 660, y: 160 }
      ],
      initialTower: { x: 360, y: 220 },
      commanderPos: { x: 610, y: 160 },
      bgImage: './assets/images/bg_level_8.png'
    },
    {
      id: 9,
      name: '第 9 關：毒沼迷徑',
      desc: '劇毒沼澤曲折死鬥。敵方魔物：【食人黑妖魔花】',
      enemyType: 'plant',
      waves: 7,
      path: [
        { x: -20, y: 200 },
        { x: 120, y: 200 },
        { x: 120, y: 80 },
        { x: 360, y: 80 },
        { x: 360, y: 260 },
        { x: 240, y: 260 },
        { x: 240, y: 350 },
        { x: 660, y: 350 }
      ],
      initialTower: { x: 250, y: 160 },
      commanderPos: { x: 610, y: 350 },
      bgImage: './assets/images/bg_level_9.png'
    },
    {
      id: 10,
      name: '第 10 關：鋸齒天險',
      desc: '極限高低折角防線。敵方魔物：【幽冥小鬼伏擊者】（過關解鎖神寵：暗夜幽影鳥）',
      enemyType: 'gremlin',
      waves: 8,
      path: [
        { x: -20, y: 60 },
        { x: 100, y: 60 },
        { x: 100, y: 300 },
        { x: 260, y: 300 },
        { x: 260, y: 100 },
        { x: 420, y: 100 },
        { x: 420, y: 320 },
        { x: 560, y: 320 },
        { x: 560, y: 200 },
        { x: 660, y: 200 }
      ],
      initialTower: { x: 340, y: 200 },
      commanderPos: { x: 610, y: 200 },
      bgImage: './assets/images/bg_level_10.png'
    },
    {
      id: 11,
      name: '第 11 關：聖域迴廊',
      desc: '聖堂外環嚴密封鎖。敵方魔物：【血袍狂熱咒術僧】',
      enemyType: 'monk',
      waves: 8,
      path: [
        { x: -20, y: 280 },
        { x: 180, y: 280 },
        { x: 180, y: 120 },
        { x: 320, y: 120 },
        { x: 320, y: 340 },
        { x: 480, y: 340 },
        { x: 480, y: 70 },
        { x: 660, y: 70 }
      ],
      initialTower: { x: 250, y: 200 },
      commanderPos: { x: 610, y: 70 },
      bgImage: './assets/images/bg_level_11.png'
    },
    {
      id: 12,
      name: '第 12 關：終焉神殿',
      desc: '終極迴轉大迷宮！敵方魔物：【銀鎧機甲聖裁者】（通關解鎖終極神寵：耀陽聖金鳥！）',
      enemyType: 'mech',
      waves: 10,
      path: [
        { x: -20, y: 360 },
        { x: 80, y: 360 },
        { x: 80, y: 60 },
        { x: 580, y: 60 },
        { x: 580, y: 300 },
        { x: 220, y: 300 },
        { x: 220, y: 180 },
        { x: 450, y: 180 },
        { x: 450, y: 240 },
        { x: 660, y: 240 }
      ],
      initialTower: { x: 330, y: 240 },
      commanderPos: { x: 610, y: 240 },
      bgImage: './assets/images/bg_level_12.png'
    }
  ],

  // 10 款可挑選英雄角色
  CHARACTERS: [
    {
      id: 'cat',
      name: '貓咪氣功大師',
      assetKey: 'char_cat',
      desc: '修練氣功的武鬥神貓，提供全場砲塔基礎攻擊力 +15%',
      perk: { damageMul: 1.15 }
    },
    {
      id: 'platina',
      name: '炸彈少女・普拉蒂娜',
      assetKey: 'char_platina',
      desc: '擅長爆破的轟炸少女，砲塔子彈命中引爆範圍與威力 +20%',
      perk: { damageMul: 1.1, splash: true }
    },
    {
      id: 'knight',
      name: '黃金聖騎士',
      assetKey: 'char_knight',
      desc: '堅毅勇敢的黃金騎士，開局額外獲得 +30 金幣與堅定意志',
      perk: { startGoldBonus: 30 }
    },
    {
      id: 'mage',
      name: '秘術大魔導士',
      assetKey: 'char_mage',
      desc: '操縱奧術光輝的大法師，全場砲塔射擊攻速 +20%',
      perk: { fireRateMul: 0.8 }
    },
    {
      id: 'dog',
      name: '機甲戰犬',
      assetKey: 'char_dog',
      desc: '忠誠機敏的機械獵犬，基地初始生命值 +4 點',
      perk: { bonusLives: 4 }
    },
    {
      id: 'bard',
      name: '傳奇吟遊詩人',
      assetKey: 'char_bard',
      desc: '彈奏激昂戰歌的吟遊詩人，每波通關獲得額外 +40% 金幣獎勵',
      perk: { goldBonusMul: 1.4 }
    },
    {
      id: 'spring_goddess',
      name: '春之女神',
      assetKey: 'char_bard',
      desc: '執掌萬物復甦的春之女神，基地初始生命值 +5，且每波通關額外恢復 1 點生命值！',
      perk: { bonusLives: 5, waveHeal: 1 }
    },
    {
      id: 'lake_goddess',
      name: '湖中女神',
      assetKey: 'char_bard',
      desc: '澄澈聖湖的守護女神，全場砲塔攻擊射程 +25%，子彈飛行速度 +20%！',
      perk: { rangeMul: 1.25, bulletSpeedMul: 1.2 }
    },
    {
      id: 'earth_goddess',
      name: '大地女神',
      assetKey: 'char_bard',
      desc: '厚重廣袤的大地女神，全場砲塔攻擊力 +20%，開局初始金幣額外 +25！',
      perk: { damageMul: 1.2, startGoldBonus: 25 }
    },
    {
      id: 'kungfu_boy',
      name: '功夫小子',
      assetKey: 'char_bard',
      desc: '武藝精湛的熱血少年，全場砲塔攻速 +25%，且擊殺魔物額外獲得 +1 金幣！',
      perk: { fireRateMul: 0.75, extraKillGold: 1 }
    }
  ],

  // 寵物系統（共 6 款神寵，每通關 2 個關卡解鎖 1 隻）
  PETS: [
    {
      id: 'flame_bird',
      name: '熾焰火靈鳥',
      unlockLevel: 2,
      desc: '通關第 2 關獲得！散發烈焰光環，使砲塔傷害 +15%',
      frame: { sx: 14, sy: 0, sw: 14, sh: 16 },
      buff: { damageMul: 1.15 }
    },
    {
      id: 'azure_bird',
      name: '蒼穹疾風鳥',
      unlockLevel: 4,
      desc: '通關第 4 關獲得！疾風祝福使砲塔射速 +20%',
      frame: { sx: 0, sy: 0, sw: 14, sh: 16 },
      buff: { fireRateMul: 0.8 }
    },
    {
      id: 'aurora_bird',
      name: '幻彩極光鳥',
      unlockLevel: 6,
      desc: '通關第 6 關獲得！每擊殺一隻敵人額外掉落 +1 金幣',
      frame: { sx: 42, sy: 16, sw: 14, sh: 16 },
      buff: { extraKillGold: 1 }
    },
    {
      id: 'cyber_bird',
      name: '未來光能鳥',
      unlockLevel: 8,
      desc: '通關第 8 關獲得！全砲塔瞄準射程 +25%',
      frame: { sx: 0, sy: 16, sw: 14, sh: 16 },
      buff: { rangeMul: 1.25 }
    },
    {
      id: 'shadow_bird',
      name: '暗夜幽影鳥',
      unlockLevel: 10,
      desc: '通關第 10 關獲得！賦予砲塔 25% 暴擊造成雙倍傷害',
      frame: { sx: 56, sy: 0, sw: 14, sh: 16 },
      buff: { critChance: 0.25 }
    },
    {
      id: 'golden_bird',
      name: '耀陽聖金鳥',
      unlockLevel: 12,
      desc: '通關第 12 關獲得！終極神寵！全場攻擊力 +15%、射程 +15%、暴擊率 +15%！',
      frame: { sx: 14, sy: 16, sw: 14, sh: 16 },
      buff: { damageMul: 1.15, rangeMul: 1.15, critChance: 0.15 }
    }
  ],

  // 各品種魔物基本參數 (一關一種專屬魔物)
  ENEMY_DEFINITIONS: {
    mon1: {
      name: '獨眼暴龍兵',
      assetKey: 'enemy_mon1',
      speedMul: 1.0,
      hpMul: 1.0
    },
    mon2: {
      name: '骷髏幽靈兵',
      assetKey: 'enemy_mon2',
      speedMul: 1.2,
      hpMul: 1.15
    },
    mon3: {
      name: '吐舌翼蝠怪',
      assetKey: 'enemy_mon3',
      speedMul: 1.35,
      hpMul: 1.3
    },
    skulli: {
      name: 'Skulli 幽魂魅影',
      assetKey: 'enemy_skulli',
      speedMul: 1.1,
      hpMul: 1.75
    },
    mage: {
      name: '暗黑秘術魔導士',
      assetKey: 'enemy_mage',
      speedMul: 0.95,
      hpMul: 2.2
    },
    spiky: {
      name: '尖刺大地岩獸',
      assetKey: 'enemy_spiky',
      speedMul: 0.85,
      hpMul: 3.2
    },
    orc: {
      name: '綠皮半獸人蠻兵',
      assetKey: 'enemy_orc',
      speedMul: 1.05,
      hpMul: 3.6
    },
    spaceman: {
      name: '星際裝甲巡航兵',
      assetKey: 'enemy_spaceman',
      speedMul: 1.15,
      hpMul: 4.0
    },
    plant: {
      name: '食人黑妖魔花',
      assetKey: 'enemy_plant',
      speedMul: 0.9,
      hpMul: 4.8
    },
    gremlin: {
      name: '幽冥小鬼伏擊者',
      assetKey: 'enemy_gremlin',
      speedMul: 1.4,
      hpMul: 4.2
    },
    monk: {
      name: '血袍狂熱咒術僧',
      assetKey: 'enemy_monk',
      speedMul: 1.0,
      hpMul: 5.6
    },
    mech: {
      name: '銀鎧機甲聖裁者',
      assetKey: 'enemy_mech',
      speedMul: 0.95,
      hpMul: 7.0
    }
  },

  PATH_CLEARANCE: 34,

  TOWER: {
    MAX_COUNT: 4,
    NEW_COST: 40,
    UPGRADE_COST: 20,
    MIN_GAP: 55,
    DEFAULT_RANGE: 135,
    DEFAULT_DAMAGE: 14,
    DEFAULT_FIRE_RATE: 520,
    DEFAULT_ANGLE: -Math.PI / 2,
    UPGRADE_DAMAGE: 9,
    UPGRADE_RANGE: 15,
    UPGRADE_FIRE_RATE_REDUCTION: 45,
    MIN_FIRE_RATE: 150
  },

  PLAYER: {
    INITIAL_GOLD: 60,
    INITIAL_LIVES: 10,
    INITIAL_WAVE: 1,
    WAVE_CLEAR_REWARD: 20
  },

  BULLET: {
    SPEED: 360,
    RADIUS: 4
  },

  ENEMY: {
    SPAWN_INTERVAL: 0.65,
    getQueueCount: (wave) => 5 + wave * 2,
    getBaseHp: (wave) => 30 + (wave - 1) * 14,
    getSpeed: (wave) => 46 + (wave - 1) * 3,
    getReward: (wave) => 5 + Math.floor(wave / 2)
  },

  COLORS: {
    BG: '#0f1720',
    PANEL: '#1b2733',
    ACCENT: '#4fd1c5',
    ACCENT2: '#f6ad55',
    DANGER: '#f56565',
    TEXT: '#e2e8f0',
    BULLET: '#e08e2c',
    BULLET_STROKE: '#8a5a12'
  }
};
