import Phaser from 'phaser';
import { UI } from '../art/palette';
import { wrapText } from '../art/fontData';
import { sound } from '../systems/audio/Sound';
import type { Action, Controls, Handler } from '../systems/input/Controls';
import { Panel } from './Window';

export interface TextBoxOpts {
  x: number;
  y: number;
  w: number;
  lines: number;
  autoAdvance?: number; // ms; if set, advances without input
}

/** Typewriter dialogue box with paging and an optional speaker tab. */
export class TextBox {
  private panel: Panel;
  private body: Phaser.GameObjects.BitmapText;
  private arrow: Phaser.GameObjects.BitmapText;
  private nameTab: Panel | null = null;
  private maxChars: number;
  private h: number;

  constructor(private scene: Phaser.Scene, private controls: Controls, private o: TextBoxOpts) {
    this.h = o.lines * 11 + 10;
    this.maxChars = Math.floor((o.w - 14) / 6);
    this.panel = new Panel(scene, o.x, o.y, o.w, this.h, 1500);
    this.body = this.panel.text(7, 6, '');
    this.arrow = this.panel.text(o.w - 12, this.h - 11, '▼', UI.accent).setVisible(false);
    scene.tweens.add({ targets: this.arrow, alpha: 0.2, yoyo: true, repeat: -1, duration: 350 });
    this.hide();
  }

  get visible(): boolean {
    return this.panel.container.visible;
  }

  show(): void {
    this.panel.container.setVisible(true);
  }

  hide(): void {
    this.panel.container.setVisible(false);
    this.setName(undefined);
  }

  /** Show text without waiting (used in battle while choosing). */
  set(s: string): void {
    this.show();
    this.body.setText(wrapText(s, this.maxChars).slice(0, this.o.lines).join('\n'));
    this.arrow.setVisible(false);
  }

  setName(who?: string): void {
    this.nameTab?.destroy();
    this.nameTab = null;
    if (!who) return;
    const w = who.length * 6 + 14;
    this.nameTab = new Panel(this.scene, this.o.x + 4, this.o.y - 15, w, 16, 1501);
    this.nameTab.text(7, 4, who, UI.accent);
  }

  async say(s: string, who?: string): Promise<void> {
    this.show();
    this.setName(who);
    const lines = wrapText(s, this.maxChars);
    for (let p = 0; p < lines.length; p += this.o.lines) {
      const page = lines.slice(p, p + this.o.lines).join('\n');
      await this.type(page);
    }
  }

  private type(page: string): Promise<void> {
    return new Promise((resolve) => {
      let shown = 0;
      let done = false;
      this.arrow.setVisible(false);
      this.body.setText('');
      const timer = this.scene.time.addEvent({
        delay: 18,
        loop: true,
        callback: () => {
          shown = Math.min(page.length, shown + 1);
          this.body.setText(page.slice(0, shown));
          if (shown % 3 === 0 && page[shown - 1] !== ' ') sound.sfx('blip');
          if (shown >= page.length) finishTyping();
        },
      });
      let autoTimer: Phaser.Time.TimerEvent | null = null;
      const finishTyping = () => {
        if (done) return;
        done = true;
        timer.remove();
        this.body.setText(page);
        this.arrow.setVisible(!this.o.autoAdvance);
        if (this.o.autoAdvance) autoTimer = this.scene.time.delayedCall(this.o.autoAdvance, finish);
      };
      const finish = () => {
        this.controls.pop(handler);
        autoTimer?.remove();
        this.arrow.setVisible(false);
        resolve();
      };
      const handler: Handler = (a: Action) => {
        if (a !== 'confirm' && a !== 'cancel') return;
        if (!done) finishTyping();
        else finish();
      };
      this.controls.push(handler);
    });
  }

  destroy(): void {
    this.nameTab?.destroy();
    this.panel.destroy();
  }
}
