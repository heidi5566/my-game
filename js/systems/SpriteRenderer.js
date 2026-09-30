/**
 * 精靈圖切分繪製器 (Sprite Renderer & Slicer)
 * 負責以 drawImage() 進行子區域切割、動畫多幀播放、縮放、旋轉及水平鏡像反轉
 */
export class SpriteRenderer {
  /**
   * 切分繪製單一幀精靈圖
   * @param {CanvasRenderingContext2D} ctx 畫布上下文
   * @param {HTMLImageElement|HTMLCanvasElement} image 精靈圖圖片物件
   * @param {{sx: number, sy: number, sw: number, sh: number}} frame 裁切來源矩形
   * @param {number} dx 目標中心 X 座標
   * @param {number} dy 目標中心 Y 座標
   * @param {{ flipX?: boolean, scale?: number, rotation?: number, alpha?: number, width?: number, height?: number }} [options]
   */
  static drawFrame(ctx, image, frame, dx, dy, options = {}) {
    if (!ctx || !image || !frame) return;

    const flipX = options.flipX || false;
    const scale = options.scale !== undefined ? options.scale : 1;
    const rotation = options.rotation || 0;
    const alpha = options.alpha !== undefined ? options.alpha : 1;

    const renderW = options.width || (frame.sw * scale);
    const renderH = options.height || (frame.sh * scale);

    ctx.save();
    ctx.translate(dx, dy);

    if (rotation !== 0) {
      ctx.rotate(rotation);
    }

    if (flipX) {
      ctx.scale(-1, 1);
    }

    if (alpha !== 1) {
      ctx.globalAlpha = alpha;
    }

    // 禁用圖像平滑以保持復古像素邊緣清晰 (Pixel Crisp)
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      image,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      -renderW / 2,
      -renderH / 2,
      renderW,
      renderH
    );

    ctx.restore();
  }
}
