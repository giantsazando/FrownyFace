import Phaser from 'phaser';
import { hexToNum, UI } from '../art/palette';
import { FONT_KEY } from '../art/pixelArt';

/** Draws an Earthbound-ish double-bordered window into a Graphics object. */
export function drawWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, border = UI.windowBorder): void {
  g.fillStyle(hexToNum(UI.windowBg), 0.94);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(hexToNum(border), 1);
  g.fillRect(x + 2, y, w - 4, 1);
  g.fillRect(x + 2, y + h - 1, w - 4, 1);
  g.fillRect(x, y + 2, 1, h - 4);
  g.fillRect(x + w - 1, y + 2, 1, h - 4);
  g.fillRect(x + 1, y + 1, 1, 1);
  g.fillRect(x + w - 2, y + 1, 1, 1);
  g.fillRect(x + 1, y + h - 2, 1, 1);
  g.fillRect(x + w - 2, y + h - 2, 1, 1);
  g.fillStyle(hexToNum(UI.windowInner), 1);
  g.fillRect(x + 3, y + 2, w - 6, 1);
  g.fillRect(x + 3, y + h - 3, w - 6, 1);
  g.fillRect(x + 2, y + 3, 1, h - 6);
  g.fillRect(x + w - 3, y + 3, 1, h - 6);
}

export function text(scene: Phaser.Scene, x: number, y: number, s: string, color: string = UI.text): Phaser.GameObjects.BitmapText {
  const t = scene.add.bitmapText(x, y, FONT_KEY, s);
  t.setTint(hexToNum(color));
  return t;
}

/** A positioned window panel inside a container (screen-fixed). */
export class Panel {
  container: Phaser.GameObjects.Container;
  g: Phaser.GameObjects.Graphics;

  constructor(public scene: Phaser.Scene, public x: number, public y: number, public w: number, public h: number, depth = 1000) {
    this.g = scene.add.graphics();
    drawWindow(this.g, 0, 0, w, h);
    this.container = scene.add.container(x, y, [this.g]).setScrollFactor(0).setDepth(depth);
  }

  add(o: Phaser.GameObjects.GameObject): this {
    this.container.add(o);
    return this;
  }

  text(x: number, y: number, s: string, color?: string): Phaser.GameObjects.BitmapText {
    const t = text(this.scene, x, y, s, color);
    this.container.add(t);
    return t;
  }

  destroy(): void {
    this.container.destroy();
  }
}
