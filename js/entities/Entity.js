/**
 * 實體基礎類別 (Base Entity)
 * 規範所有場景中可更新與繪製物件之基本行為
 */
export class Entity {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.dead = false;
  }

  /**
   * 邏輯更新（由子類別覆寫）
   * @param {number} dt Delta Time（秒）
   */
  update(dt) {}

  /**
   * 畫面渲染（由子類別覆寫）
   * @param {CanvasRenderingContext2D} ctx 2D 畫布上下文
   */
  render(ctx) {}
}
