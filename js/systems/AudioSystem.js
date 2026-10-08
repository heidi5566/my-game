/**
 * 完整音訊管理系統 (Audio & Music System)
 * 整合 HTML5 Audio（背景音樂 BGM）與 Web Audio API（音效合成與 SFX 播放），
 * 嚴格符合瀏覽器自動播放政策（Autoplay Policy），支援獨立音樂/音效開關
 */
export class AudioSystem {
  constructor(assetManager = null) {
    this.assetManager = assetManager;
    this.audioCtx = null;
    this.soundOn = true;
    this.musicOn = true;
    this.unlocked = false;
    this.bgmAudio = null;
    this.bgmPlaying = false;
    this.initBGM();
  }

  /**
   * 初始化 BGM 實例
   */
  initBGM() {
    try {
      this.bgmAudio = new Audio();
      this.bgmAudio.src = './assets/audio/bgm.mp3';
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.35;
      this.bgmAudio.preload = 'auto';
    } catch (e) {
      console.warn('[AudioSystem] 初始化 BGM 音訊物件失敗:', e);
    }
  }

  /**
   * 確保 AudioContext 已初始化並處於 running 狀態
   */
  ensureAudio() {
    if (!this.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.audioCtx = new AC();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    this.unlocked = true;
  }

  /**
   * 播放循環背景音樂 (BGM)
   */
  playBGM() {
    if (!this.musicOn || !this.bgmAudio) return;
    this.ensureAudio();

    try {
      this.bgmAudio.muted = false;
      this.bgmAudio.volume = 0.35;
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.bgmPlaying = true;
          })
          .catch((err) => {
            console.warn('[AudioSystem] BGM 自動播放等待手勢解鎖:', err);
            this.bgmPlaying = false;
          });
      }
    } catch (err) {
      console.warn('[AudioSystem] BGM 播放警示:', err);
    }
  }

  /**
   * 暫停背景音樂
   */
  pauseBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmPlaying = false;
    }
  }

  /**
   * 切換音效開關
   */
  toggleSound() {
    this.soundOn = !this.soundOn;
    if (this.soundOn) {
      this.ensureAudio();
    }
    return this.soundOn;
  }

  /**
   * 切換背景音樂開關
   */
  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musicOn) {
      this.ensureAudio();
      this.playBGM();
    } else {
      this.pauseBGM();
    }
    return this.musicOn;
  }

  isSoundOn() {
    return this.soundOn;
  }

  isMusicOn() {
    return this.musicOn;
  }

  /**
   * 播放發射砲彈/雷射音效
   */
  playShoot() {
    if (!this.soundOn) return;
    this.ensureAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  /**
   * 播放受擊命中音效
   */
  playHit() {
    if (!this.soundOn) return;
    this.ensureAudio();

    const sfxHit = this.assetManager ? this.assetManager.getAudio('sfx_hit') : null;
    if (sfxHit && sfxHit.src) {
      try {
        const clone = sfxHit.cloneNode();
        clone.volume = 0.25;
        clone.play().catch(() => {});
        return;
      } catch (e) {}
    }

    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  /**
   * 播放炸彈/敵人爆炸音效
   */
  playExplosion() {
    if (!this.soundOn) return;
    this.ensureAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const dur = 0.38;
      const bufferSize = Math.floor(this.audioCtx.sampleRate * dur);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1300, now);
      filter.frequency.exponentialRampToValueAtTime(160, now + dur);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      noise.start(now);
    } catch (e) {}
  }

  /**
   * 播放建造部署音效
   */
  playPlace() {
    if (!this.soundOn) return;
    this.ensureAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(640, now + 0.12);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * 播放升級音效
   */
  playUpgrade() {
    if (!this.soundOn) return;
    this.ensureAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const t = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.1);
      });
    } catch (e) {}
  }

  /**
   * 播放波次開始音效
   */
  playWaveStart() {
    if (!this.soundOn) return;
    this.ensureAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  /**
   * 播放遊戲結束 (失敗) 音效
   */
  playGameOver() {
    if (!this.soundOn) return;
    this.ensureAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [330, 311.13, 293.66, 277.18];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const t = now + idx * 0.15;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (e) {}
  }

  /**
   * 播放遊戲勝利音效
   */
  playVictory() {
    if (!this.soundOn) return;
    this.ensureAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const t = now + idx * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch (e) {}
  }
}
