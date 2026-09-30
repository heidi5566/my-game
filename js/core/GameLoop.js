/**
 * 遊戲主循環與 Delta Time 計算器 (Game Loop)
 * 使用 requestAnimationFrame 提供平滑動畫，並以精準的 Delta Time 驅動遊戲邏輯更新
 */
export class GameLoop {
  /**
   * @param {Function} updateFn (dt, now) 邏輯更新回調
   * @param {Function} renderFn (now) 渲染回調
   */
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.lastTime = 0;
    this.animationFrameId = null;
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    this.tick = this.tick.bind(this);
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  tick(now) {
    if (!this.running) return;

    if (!this.lastTime) {
      this.lastTime = now;
    }

    // 將幀間隔轉換為秒，並限制最大步進為 0.05 秒（防止切換分頁恢復時突變穿牆）
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.updateFn) {
      this.updateFn(dt, now);
    }
    if (this.renderFn) {
      this.renderFn(now);
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  }
}
