import Phaser from 'phaser';
import { CELL_H, CELL_W } from '../art/fontData';

/** Rolling digit display backed by the vertical 'digits' strip texture. */
export class Odometer {
  private digits: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, x: number, private y: number, private places = 3) {
    for (let i = 0; i < places; i++) {
      const img = scene.add.image(x + i * CELL_W, y, 'digits').setOrigin(0, 0);
      container.add(img);
      this.digits.push(img);
    }
    this.setValue(0);
  }

  setTint(c: number): void {
    this.digits.forEach((d) => d.setTint(c));
  }

  /** v may be fractional: lower digits roll continuously, higher ones carry. */
  setValue(v: number): void {
    v = Math.max(0, v);
    for (let i = 0; i < this.places; i++) {
      const p = Math.pow(10, this.places - 1 - i);
      let pos: number;
      if (p === 1) pos = v % 10;
      else {
        const whole = Math.floor(v / p) % 10;
        const carry = Math.min(1, Math.max(0, (v % p) - (p - 1)));
        pos = whole + carry;
      }
      // hide leading zeros
      const hidden = v < p && p > 1 && Math.ceil(v) < p;
      const py = Math.round(pos * CELL_H);
      const img = this.digits[i];
      img.setVisible(!hidden);
      img.setCrop(0, py, CELL_W, CELL_H);
      img.y = this.y - py;
    }
  }
}
