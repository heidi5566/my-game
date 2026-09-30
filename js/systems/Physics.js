/**
 * 物理幾何運算與碰撞檢驗系統 (Physics & Geometry System)
 */
export class Physics {
  /**
   * 計算兩點之間的歐幾里得距離
   */
  static pointDist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  /**
   * 計算點到線段 (A-B) 的最短距離
   */
  static distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  /**
   * 計算點到折線路徑的最短距離
   */
  static distToPath(px, py, path) {
    let min = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const d = Physics.distToSegment(
        px, py,
        path[i].x, path[i].y,
        path[i + 1].x, path[i + 1].y
      );
      if (d < min) min = d;
    }
    return min;
  }

  /**
   * 將角度標準化至 [-π, π] 區間，便於進行最短角差平滑旋轉
   */
  static normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  /**
   * 驗證砲塔放置位置是否合法
   */
  static isValidPlacement(x, y, path, towers, clearance = 34, minGap = 55, width = 640, height = 420) {
    // 邊界檢查（保留26px邊緣）
    if (x < 26 || x > width - 26 || y < 26 || y > height - 26) {
      return false;
    }
    // 道路淨空檢查
    if (Physics.distToPath(x, y, path) < clearance) {
      return false;
    }
    // 與現有砲塔的最小間距檢查
    for (const t of towers) {
      if (Physics.pointDist(x, y, t.x, t.y) < minGap) {
        return false;
      }
    }
    return true;
  }
}
