/**
 * ==============================================================================
 * JuiceSystem - 遊戲打擊手感與即時音效合成獨立模組 (Game Juice & Web Audio System)
 * ==============================================================================
 *
 * 本模組提供：
 * 1. 平滑鏡頭震動 (Camera / Screen Shake)：
 *    - shake(amount) 累加震動能量，搭配阻尼衰減平滑回正。
 *    - 不改動 DOM（避免滑鼠座標換算偏移），只維護 offsetX / offsetY，
 *      由 Game.render() 每幀呼叫 step() 推進，再以 ctx.translate(offsetX, offsetY) 套用。
 *
 * 2. Web Audio 即時音效合成 (Native Web Audio API Synthesis)：
 *    - 完全免外部音訊檔案，純程式即時動態合成。
 *    - 雷射開火音效 (Laser Fire SFX)：向下快速滑頻 (Frequency Sweep) 鋸齒波。
 *    - 打擊嗶嗶音效 (Hit Beep SFX)：短促清脆的打擊反饋嗶嗶聲。
 *    - 透過 useAudio() 共用 AudioSystem 既有的 AudioContext 與音效開關，
 *      不另外建立第二個 AudioContext，也不另外註冊手勢解鎖監聽器。
 */

export class JuiceSystemCore {
  constructor(options = {}) {
    // 震動系統狀態
    this.shakeIntensity = 0;
    this.maxIntensity = options.maxIntensity || 35;
    this.decay = options.decay || 0.88; // 每影格阻尼衰減率
    this.offsetX = 0;
    this.offsetY = 0;

    // 音效系統：由 useAudio() 注入
    this.masterVolume = options.volume !== undefined ? options.volume : 0.3;
    this.muted = false;
    this._getAudioContext = () => null;
    this._isSoundOn = () => true;
  }

  /**
   * 注入音訊來源（由 Game 在建構時呼叫）
   * @param {{ getContext: () => AudioContext|null, isSoundOn?: () => boolean }} provider
   */
  useAudio({ getContext, isSoundOn } = {}) {
    if (typeof getContext === 'function') this._getAudioContext = getContext;
    if (typeof isSoundOn === 'function') this._isSoundOn = isSoundOn;
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
    return this;
  }

  /**
   * 每幀推進震動（由 Game.render() 呼叫，不自己開 requestAnimationFrame）
   */
  step() {
    if (this.shakeIntensity > 0.08) {
      // 隨機角度與長度生成二維隨機位移向量 (Random Displacement)
      const angle = Math.random() * Math.PI * 2;
      const distance = this.shakeIntensity * (0.6 + Math.random() * 0.4);
      this.offsetX = Math.cos(angle) * distance;
      this.offsetY = Math.sin(angle) * distance;
      // 應用平滑阻尼衰減 (Smooth Exponential Decay)
      this.shakeIntensity *= this.decay;
    } else {
      this.reset();
    }
  }

  /**
   * 立即停止震動（換關、回主選單時呼叫）
   */
  reset() {
    this.shakeIntensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  /**
   * 取得當前鏡頭位移偏移量
   * @returns {{x: number, y: number}}
   */
  getOffset() {
    return { x: this.offsetX, y: this.offsetY };
  }

  /**
   * 取得可用的 AudioContext；靜音或尚未解鎖時回傳 null
   */
  _readyContext() {
    if (this.muted || !this._isSoundOn()) return null;
    const ctx = this._getAudioContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  /**
   * 合成一個滑頻短音（雷射與打擊共用）
   */
  _sweep(defaults, options) {
    const ctx = this._readyContext();
    if (!ctx) return null;

    try {
      const now = ctx.currentTime;
      const duration = options.duration || defaults.duration;
      const startFreq = options.startFreq || defaults.startFreq;
      const endFreq = options.endFreq || defaults.endFreq;
      const volume = (options.volume !== undefined ? options.volume : defaults.volume) * this.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = options.type || defaults.type;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);

      gain.gain.setValueAtTime(Math.max(0.001, volume), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
      // 播完後中斷連線，讓節點可以被回收
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
      return { osc, gain };
    } catch (err) {
      console.warn('[JuiceSystem] 音效合成失敗:', err);
      return null;
    }
  }

  /**
   * 合成播放雷射開火音效 (Laser Fire Sound)：鋸齒波由高頻急速下滑至低頻
   */
  playLaser(options = {}) {
    return this._sweep({ duration: 0.11, startFreq: 960, endFreq: 120, volume: 0.22, type: 'sawtooth' }, options);
  }

  /**
   * 合成播放打擊嗶嗶聲 (Hit Beep Sound)：三角波短促音頻變化
   */
  playHit(options = {}) {
    return this._sweep({ duration: 0.065, startFreq: 580, endFreq: 180, volume: 0.28, type: 'triangle' }, options);
  }

  /**
   * 同時觸發打擊嗶嗶聲與鏡頭微震動 (Combo Impact)
   */
  playImpact(shakeAmount = 6) {
    this.shake(shakeAmount);
    return this.playHit();
  }

  setMuted(muted) {
    this.muted = !!muted;
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /** 調整主音量 (0.0 ~ 1.0) */
  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    return this.masterVolume;
  }
}

// 建立預設單例，以 ES Module 匯出（不掛到 window）
export const JuiceSystem = new JuiceSystemCore();
export default JuiceSystem;
