import Phaser from 'phaser';
import { UI } from '../art/palette';
import { sound } from '../systems/audio/Sound';
import type { Action, Controls, Handler } from '../systems/input/Controls';
import { Panel } from './Window';

export interface MenuItem {
  label: string;
  right?: string;
  disabled?: boolean;
}

export interface MenuOpts {
  x: number;
  y: number;
  w: number;
  columns?: number;
  colWidth?: number;
  maxRows?: number;
  cancelable?: boolean;
  start?: number;
  title?: string;
  onMove?: (index: number) => void;
  depth?: number;
}

export const CANCELLED = -1;
export const ABORTED = -2;

/** A cursor-driven choice window. Resolves with the chosen index or CANCELLED. */
export class Menu {
  private panel!: Panel;
  private handler!: Handler;
  private resolveFn!: (i: number) => void;
  private index = 0;
  private scroll = 0;
  private rows: Phaser.GameObjects.BitmapText[] = [];
  private rights: Phaser.GameObjects.BitmapText[] = [];
  private cursor!: Phaser.GameObjects.BitmapText;
  private closed = false;

  constructor(private scene: Phaser.Scene, private controls: Controls, private items: MenuItem[], private o: MenuOpts) {}

  open(): Promise<number> {
    const cols = this.o.columns ?? 1;
    const visibleRows = Math.min(this.o.maxRows ?? 99, Math.ceil(this.items.length / cols));
    const titleH = this.o.title ? 11 : 0;
    const h = visibleRows * 11 + 10 + titleH;
    this.panel = new Panel(this.scene, this.o.x, this.o.y, this.o.w, h, this.o.depth ?? 1600);
    if (this.o.title) this.panel.text(7, 5, this.o.title, UI.accent);
    for (let r = 0; r < visibleRows * cols; r++) {
      this.rows.push(this.panel.text(0, 0, ''));
      this.rights.push(this.panel.text(0, 0, ''));
    }
    this.cursor = this.panel.text(0, 0, '▶', UI.accent);
    this.index = Math.min(this.o.start ?? 0, this.items.length - 1);
    this.render();
    return new Promise((res) => {
      this.resolveFn = res;
      this.handler = (a: Action) => this.onAction(a);
      this.controls.push(this.handler);
      this.o.onMove?.(this.index);
    });
  }

  private layout(slot: number) {
    const cols = this.o.columns ?? 1;
    const colW = this.o.colWidth ?? Math.floor((this.o.w - 14) / cols);
    const titleH = this.o.title ? 11 : 0;
    return { x: 14 + (slot % cols) * colW, y: 6 + titleH + Math.floor(slot / cols) * 11, colW };
  }

  private render(): void {
    const cols = this.o.columns ?? 1;
    const visible = this.rows.length;
    const row = Math.floor(this.index / cols);
    const visRows = visible / cols;
    if (row < this.scroll) this.scroll = row;
    if (row >= this.scroll + visRows) this.scroll = row - visRows + 1;
    for (let s = 0; s < visible; s++) {
      const i = this.scroll * cols + s;
      const it = this.items[i];
      const { x, y, colW } = this.layout(s);
      const t = this.rows[s];
      const rt = this.rights[s];
      t.setPosition(x, y).setText(it ? it.label : '');
      t.setTint(Phaser.Display.Color.HexStringToColor(it?.disabled ? UI.dim : UI.text).color);
      rt.setText(it?.right ?? '');
      rt.setPosition(x + colW - 10 - rt.text.length * 6, y);
      rt.setTint(Phaser.Display.Color.HexStringToColor(it?.disabled ? UI.dim : UI.text).color);
      if (i === this.index) this.cursor.setPosition(x - 8, y);
    }
  }

  private onAction(a: Action): void {
    const cols = this.o.columns ?? 1;
    const n = this.items.length;
    const prev = this.index;
    if (a === 'up' && this.index - cols >= 0) this.index -= cols;
    else if (a === 'down' && this.index + cols < n) this.index += cols;
    else if (a === 'left' && cols > 1 && this.index % cols > 0) this.index -= 1;
    else if (a === 'right' && cols > 1 && this.index % cols < cols - 1 && this.index + 1 < n) this.index += 1;
    else if (a === 'confirm') {
      if (this.items[this.index]?.disabled) {
        sound.sfx('miss');
        return;
      }
      sound.sfx('confirm');
      this.close(this.index);
      return;
    } else if (a === 'cancel' && this.o.cancelable !== false) {
      sound.sfx('cancel');
      this.close(CANCELLED);
      return;
    }
    if (prev !== this.index) {
      sound.sfx('move');
      this.render();
      this.o.onMove?.(this.index);
    }
  }

  close(result: number): void {
    if (this.closed) return;
    this.closed = true;
    this.controls.pop(this.handler);
    this.panel.destroy();
    this.resolveFn(result);
  }

  abort(): void {
    this.close(ABORTED);
  }
}
