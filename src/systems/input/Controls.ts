import Phaser from 'phaser';

export type Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel';

const KEYMAP: Record<string, Action> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'confirm',
  Enter: 'confirm',
  Space: 'confirm',
  KeyX: 'cancel',
  Escape: 'cancel',
  Backspace: 'cancel',
};

export type Handler = (a: Action) => void;

/**
 * Keyboard input with a focus stack: only the top handler receives discrete
 * actions, so dialogue boxes and menus can take over from the overworld.
 */
export class Controls {
  private held = new Set<Action>();
  private stack: Handler[] = [];

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    kb.addCapture('UP,DOWN,LEFT,RIGHT,SPACE,ENTER,BACKSPACE');
    const onDown = (e: KeyboardEvent) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      this.held.add(a);
      const isDir = a === 'up' || a === 'down' || a === 'left' || a === 'right';
      if (e.repeat && !isDir) return;
      const top = this.stack[this.stack.length - 1];
      if (top) top(a);
    };
    const onUp = (e: KeyboardEvent) => {
      const a = KEYMAP[e.code];
      if (a) this.held.delete(a);
    };
    kb.on('keydown', onDown);
    kb.on('keyup', onUp);
    scene.events.on(Phaser.Scenes.Events.WAKE, () => this.held.clear());
    scene.events.on(Phaser.Scenes.Events.RESUME, () => this.held.clear());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown', onDown);
      kb.off('keyup', onUp);
    });
  }

  isDown(a: Action): boolean {
    return this.held.has(a);
  }

  push(h: Handler): void {
    this.stack.push(h);
  }

  pop(h: Handler): void {
    const i = this.stack.lastIndexOf(h);
    if (i >= 0) this.stack.splice(i, 1);
  }

  get depth(): number {
    return this.stack.length;
  }

  /** Wait for a single confirm/cancel press. */
  waitConfirm(): Promise<Action> {
    return new Promise((res) => {
      const h: Handler = (a) => {
        if (a === 'confirm' || a === 'cancel') {
          this.pop(h);
          res(a);
        }
      };
      this.push(h);
    });
  }
}
