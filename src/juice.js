/**
 * ==============================================================================
 * JuiceSystem - 遊戲打擊手感與即時音效合成獨立模組 (Game Juice & Web Audio System)
 * ==============================================================================
 * 
 * 本模組提供：
 * 1. 平滑鏡頭震動 (Camera / Screen Shake)：
 *    - 提供 shake(amount) 函式，利用隨機位移向量搭配物理阻尼衰減，實現平滑鏡頭晃動回彈。
 *    - 自動支援 CSS Transform 隨機位移（針對 Canvas 或容器），亦即時維護座標偏移量 (offsetX, offsetY)
 *      供 Canvas 2D Context 自行調用 translate。
 * 
 * 2. Web Audio 即時音效合成 (Native Web Audio API Synthesis)：
 *    - 完全免外部音訊檔案，純程式即時動態合成。
 *    - 雷射開火音效 (Laser Fire SFX)：向下快速滑頻 (Frequency Sweep) 鋸齒波，營造科幻俐落開火質感。
 *    - 打擊嗶嗶音效 (Hit Beep SFX)：短促清脆的打擊反饋嗶嗶聲 (Punchy Triangle/Square Beep)。
 * 
 * 3. 瀏覽器自動播放政策相容 (Autoplay Policy Compatibility)：
 *    - 於首次使用者手勢互動（點擊/按鍵）時自動解鎖並恢復 AudioContext。
 */

class JuiceSystemCore {
  constructor(options = {}) {
    // 震動系統狀態
    this.targetSelector = options.targetSelector || '#game, #canvasContainer, canvas';
    this.targetElement = options.target || null;
    this.shakeIntensity = 0;
    this.maxIntensity = options.maxIntensity || 35;
    this.decay = options.decay || 0.88; // 每影格阻尼衰減率
    this.offsetX = 0;
    this.offsetY = 0;
    this._rafId = null;

    // 音效系統狀態 (Web Audio API)
    this.audioCtx = null;
    this.muted = false;
    this.masterVolume = options.volume !== undefined ? options.volume : 0.3;
    this._audioUnlocked = false;

    // 自動初始化手勢監聽以解鎖 AudioContext
    if (typeof window !== 'undefined') {
      this._setupGestureUnlock();
    }
  }

  /**
   * 取得或尋找震動目標 DOM 元素
   */
  getTargetElement() {
    if (this.targetElement && typeof document !== 'undefined' && document.body.contains(this.targetElement)) {
      return this.targetElement;
    }
    if (typeof document !== 'undefined') {
      this.targetElement =
        document.querySelector(this.targetSelector) ||
        document.getElementById('game') ||
        document.getElementById('canvasContainer') ||
        document.querySelector('canvas');
    }
    return this.targetElement;
  }

  /**
   * 自訂指定震動目標元素
   * @param {HTMLElement|string} target 
   */
  setTarget(target) {
    if (typeof target === 'string' && typeof document !== 'undefined') {
      this.targetElement = document.querySelector(target);
    } else if (target && typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) {
      this.targetElement = target;
    }
    return this;
  }

  /**
   * 觸發平滑鏡頭震動 (Camera / Screen Shake)
   * @param {number} amount 震動強度 (數值越大震幅越大，預設 8)
   */
  shake(amount = 8) {
    const val = typeof amount === 'number' && !isNaN(amount) ? amount : 8;
    // 累加震動能量，並限制在安全上限內以避免畫面破壞
    this.shakeIntensity = Math.min(this.maxIntensity, this.shakeIntensity + val);

    // 若動畫循環尚未啟動，則啟動更新
    if (!this._rafId && typeof requestAnimationFrame !== 'undefined') {
      this._updateShake();
    }
    return this;
  }

  /**
   * 震動循環更新 (利用隨機位移與阻尼實現平滑鏡頭晃動與回正)
   */
  _updateShake() {
    if (this.shakeIntensity > 0.08) {
      // 隨機角度與長度生成二維隨機位移向量 (Random Displacement)
      const angle = Math.random() * Math.PI * 2;
      const distance = this.shakeIntensity * (0.6 + Math.random() * 0.4);

      this.offsetX = Math.cos(angle) * distance;
      this.offsetY = Math.sin(angle) * distance;

      // 應用平滑阻尼衰減 (Smooth Exponential Decay)
      this.shakeIntensity *= this.decay;

      // 套用至 DOM 節點 Transform
      this._applyDOMTransform();

      this._rafId = requestAnimationFrame(() => this._updateShake());
    } else {
      // 震動完全平息，歸零並重置樣式
      this.shakeIntensity = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this._applyDOMTransform();
      this._rafId = null;
    }
  }

  /**
   * 將位移座標套用到目標 DOM 元素
   */
  _applyDOMTransform() {
    const target = this.getTargetElement();
    if (!target) return;

    if (this.offsetX !== 0 || this.offsetY !== 0) {
      target.style.transform = `translate(${this.offsetX.toFixed(2)}px, ${this.offsetY.toFixed(2)}px)`;
    } else {
      target.style.transform = '';
    }
  }

  /**
   * 取得當前鏡頭位移偏移量 (供 Canvas 手動渲染循環使用)
   * @returns {{x: number, y: number}}
   */
  getOffset() {
    return { x: this.offsetX, y: this.offsetY };
  }

  /**
   * 確保 AudioContext 已初始化並嘗試喚醒
   */
  getAudioContext() {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * 註冊使用者初次手勢監聽，解除瀏覽器自動播放限制
   */
  _setupGestureUnlock() {
    if (this._audioUnlocked || typeof document === 'undefined') return;

    const unlock = () => {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'running') {
        this._audioUnlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      } else if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this._audioUnlocked = true;
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        }).catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  /**
   * 合成播放雷射開火音效 (Laser Fire Sound)
   * 利用鋸齒波由高頻急速下滑至低頻，模擬經典科幻雷射砲開火聲
   * @param {Object} options 自訂頻率與音量參數
   */
  playLaser(options = {}) {
    if (this.muted) return null;
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      const now = ctx.currentTime;
      const duration = options.duration || 0.11;
      const startFreq = options.startFreq || 960;
      const endFreq = options.endFreq || 120;
      const volume = (options.volume !== undefined ? options.volume : 0.22) * this.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = options.type || 'sawtooth';

      // 頻率急速下滑 (Laser pitch drop)
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);

      // 音量包絡 (快速淡入與指數衰減)
      gain.gain.setValueAtTime(Math.max(0.001, volume), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);

      return { osc, gain };
    } catch (err) {
      console.warn('[JuiceSystem] playLaser 合成失敗:', err);
      return null;
    }
  }

  /**
   * 合成播放雷射發射 (別名)
   */
  playShoot(options = {}) {
    return this.playLaser(options);
  }

  /**
   * 合成播放打擊嗶嗶聲 (Hit Beep Sound)
   * 利用三角波/方波短促音頻震盪，呈現清脆打擊反饋嗶嗶聲
   * @param {Object} options 自訂頻率與音量參數
   */
  playHit(options = {}) {
    if (this.muted) return null;
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      const now = ctx.currentTime;
      const duration = options.duration || 0.065;
      const startFreq = options.startFreq || 580;
      const endFreq = options.endFreq || 180;
      const volume = (options.volume !== undefined ? options.volume : 0.28) * this.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = options.type || 'triangle';

      // 打擊清脆音頻短促變化 (Hit Beep Chirp)
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);

      // 打擊敲擊感音量包絡 (Punchy Decay)
      gain.gain.setValueAtTime(Math.max(0.001, volume), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.015);

      return { osc, gain };
    } catch (err) {
      console.warn('[JuiceSystem] playHit 合成失敗:', err);
      return null;
    }
  }

  /**
   * 合成打擊嗶嗶聲 (別名)
   */
  playBeep(options = {}) {
    return this.playHit(options);
  }

  /**
   * 合成打擊嗶嗶聲 (完整別名)
   */
  playHitBeep(options = {}) {
    return this.playHit(options);
  }

  /**
   * 同時觸發打擊嗶嗶聲與鏡頭微震動 (Combo Impact)
   * @param {number} shakeAmount 震動強度 (預設 6)
   */
  playImpact(shakeAmount = 6) {
    this.shake(shakeAmount);
    return this.playHit();
  }

  /**
   * 設定靜音狀態
   * @param {boolean} muted 
   */
  setMuted(muted) {
    this.muted = !!muted;
    return this.muted;
  }

  /**
   * 切換靜音開關
   */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * 調整主音量 (0.0 ~ 1.0)
   */
  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    return this.masterVolume;
  }
}

// 建立預設單例物件
const defaultJuiceInstance = new JuiceSystemCore();

/**
 * JuiceSystem 對外介面物件：
 * 既可直接作為物件呼叫 JuiceSystem.shake(...)、JuiceSystem.playLaser()、JuiceSystem.playHit()，
 * 亦支援 new JuiceSystem() 實例化或作為模組引入。
 */
const JuiceSystem = {
  // 核心單例參考
  instance: defaultJuiceInstance,

  // 震動函式
  shake(amount) {
    return defaultJuiceInstance.shake(amount);
  },

  // 鏡頭偏移量取得
  getOffset() {
    return defaultJuiceInstance.getOffset();
  },

  // 音效合成函式
  playLaser(options) {
    return defaultJuiceInstance.playLaser(options);
  },
  playShoot(options) {
    return defaultJuiceInstance.playLaser(options);
  },
  playHit(options) {
    return defaultJuiceInstance.playHit(options);
  },
  playBeep(options) {
    return defaultJuiceInstance.playHit(options);
  },
  playHitBeep(options) {
    return defaultJuiceInstance.playHit(options);
  },
  playImpact(shakeAmount) {
    return defaultJuiceInstance.playImpact(shakeAmount);
  },

  // 控制設定函式
  setTarget(target) {
    return defaultJuiceInstance.setTarget(target);
  },
  setMuted(muted) {
    return defaultJuiceInstance.setMuted(muted);
  },
  toggleMute() {
    return defaultJuiceInstance.toggleMute();
  },
  setVolume(vol) {
    return defaultJuiceInstance.setVolume(vol);
  },
  getAudioContext() {
    return defaultJuiceInstance.getAudioContext();
  },

  // 即時屬性映射
  get offsetX() {
    return defaultJuiceInstance.offsetX;
  },
  set offsetX(v) {
    defaultJuiceInstance.offsetX = v;
  },
  get offsetY() {
    return defaultJuiceInstance.offsetY;
  },
  set offsetY(v) {
    defaultJuiceInstance.offsetY = v;
  },
  get shakeIntensity() {
    return defaultJuiceInstance.shakeIntensity;
  },
  set shakeIntensity(v) {
    defaultJuiceInstance.shakeIntensity = v;
  }
};

// 支援全域掛載 (Browser Global)
if (typeof window !== 'undefined') {
  window.JuiceSystem = JuiceSystem;
}

// 支援 ES Module 導出
export default JuiceSystem;
export { JuiceSystem, JuiceSystemCore };
