/**
 * 資源管理器與預加載器 (Asset Manager & Preloader)
 * 負責非同步載入所有遊戲精靈圖與音訊，支援進度回調與安全快取
 */
export class AssetManager {
  constructor() {
    this.images = new Map();
    this.audios = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
  }

  /**
   * 載入單一圖片資源
   * @param {string} key 資源識別鍵
   * @param {string} src 相對路徑
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        this.loadedCount++;
        resolve(img);
      };
      img.onerror = (err) => {
        console.warn(`[AssetManager] 圖片載入失敗: ${src}，建立備用畫布`, err);
        // 建立空白畫布做為容錯備份
        const fallback = document.createElement('canvas');
        fallback.width = 32;
        fallback.height = 32;
        this.images.set(key, fallback);
        this.loadedCount++;
        resolve(fallback);
      };
      img.src = src;
    });
  }

  /**
   * 載入單一音訊資源
   * @param {string} key 資源識別鍵
   * @param {string} src 相對路徑
   * @returns {Promise<HTMLAudioElement>}
   */
  loadAudio(key, src) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'auto';
      const onReady = () => {
        cleanup();
        this.audios.set(key, audio);
        this.loadedCount++;
        resolve(audio);
      };
      const onError = (err) => {
        cleanup();
        console.warn(`[AssetManager] 音訊預載入警示: ${src}`, err);
        this.audios.set(key, audio);
        this.loadedCount++;
        resolve(audio);
      };
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onReady);
        audio.removeEventListener('error', onError);
      };

      audio.addEventListener('canplaythrough', onReady, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.src = src;
      // 容錯計時器（避免瀏覽器卡住不觸發事件）
      setTimeout(() => {
        if (!this.audios.has(key)) {
          this.audios.set(key, audio);
          this.loadedCount++;
          resolve(audio);
        }
      }, 1500);
    });
  }

  /**
   * 批次預載入所有資源清單
   * @param {{ images?: Record<string, string>, audios?: Record<string, string> }} manifest
   * @param {(loaded: number, total: number) => void} onProgress
   * @returns {Promise<void>}
   */
  async preloadAll(manifest, onProgress = null) {
    const imgEntries = Object.entries(manifest.images || {});
    const audioEntries = Object.entries(manifest.audios || {});
    this.totalCount = imgEntries.length + audioEntries.length;
    this.loadedCount = 0;

    const promises = [];

    for (const [key, src] of imgEntries) {
      promises.push(
        this.loadImage(key, src).then(() => {
          if (onProgress) onProgress(this.loadedCount, this.totalCount);
        })
      );
    }

    for (const [key, src] of audioEntries) {
      promises.push(
        this.loadAudio(key, src).then(() => {
          if (onProgress) onProgress(this.loadedCount, this.totalCount);
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * 取得已載入的圖片物件
   * @param {string} key
   * @returns {HTMLImageElement|HTMLCanvasElement|null}
   */
  getImage(key) {
    return this.images.get(key) || null;
  }

  /**
   * 取得已載入的音訊物件
   * @param {string} key
   * @returns {HTMLAudioElement|null}
   */
  getAudio(key) {
    return this.audios.get(key) || null;
  }
}
