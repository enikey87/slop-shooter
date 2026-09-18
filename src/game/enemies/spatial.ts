// Равномерная сетка для поиска соседей. Размер ячейки ≥ максимальной дистанции взаимодействия,
// тогда достаточно проверить 3×3 ячейки вокруг точки.
export class SpatialHash<T extends { x: number; y: number }> {
  private readonly cells = new Map<number, number[]>();
  private items: T[] = [];
  constructor(private readonly size: number) {}

  private key(cx: number, cy: number): number { return (cx + 1024) * 4096 + (cy + 1024); }

  rebuild(items: T[]): void {
    this.items = items;
    this.cells.clear();
    for (let i = 0; i < items.length; i++) {
      const k = this.key(Math.floor(items[i].x / this.size), Math.floor(items[i].y / this.size));
      let c = this.cells.get(k);
      if (!c) this.cells.set(k, c = []);
      c.push(i);
    }
  }

  /** Все элементы в соседних ячейках (с индексом в исходном массиве). */
  near(x: number, y: number, fn: (item: T, index: number) => void): void {
    const cx = Math.floor(x / this.size), cy = Math.floor(y / this.size);
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const c = this.cells.get(this.key(cx + ox, cy + oy));
      if (c) for (const i of c) fn(this.items[i], i);
    }
  }
}
