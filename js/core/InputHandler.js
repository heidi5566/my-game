/**
 * 輸入事件集中監聽器 (Input Handler)
 * 負責滑鼠與觸控事件監聽，自動換算畫布縮放座標，解耦視圖與事件監聽
 */
export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.mousePos = { x: null, y: null };
    this.onClick = null;
    this.onMouseMove = null;
    this.onMouseLeave = null;

    this.initListeners();
  }

  /**
   * 計算考慮 CSS 縮放後的精確畫布座標
   */
  getCanvasPos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  initListeners() {
    this.canvas.addEventListener('mousemove', (evt) => {
      this.mousePos = this.getCanvasPos(evt);
      if (this.onMouseMove) {
        this.onMouseMove(this.mousePos, evt);
      }
    });

    this.canvas.addEventListener('mouseleave', (evt) => {
      this.mousePos = { x: null, y: null };
      if (this.onMouseLeave) {
        this.onMouseLeave(evt);
      }
    });

    this.canvas.addEventListener('click', (evt) => {
      const pos = this.getCanvasPos(evt);
      if (this.onClick) {
        this.onClick(pos, evt);
      }
    });

    // 支援觸控設備
    this.canvas.addEventListener('touchstart', (evt) => {
      const pos = this.getCanvasPos(evt);
      this.mousePos = pos;
    }, { passive: true });
  }

  getMousePos() {
    return this.mousePos;
  }

  setCursorPlacing(isPlacing) {
    if (isPlacing) {
      this.canvas.classList.add('placing');
    } else {
      this.canvas.classList.remove('placing');
    }
  }
}
