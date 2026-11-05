import Phaser from 'phaser';
import { UI } from '../art/palette';
import { FONT_KEY } from '../art/pixelArt';
import { sound } from '../systems/audio/Sound';
import { createBattleBackground } from '../systems/battle/BattleBackground';
import { Controls } from '../systems/input/Controls';
import { GameState, newGame } from '../systems/state/GameState';
import { hasSave, loadGame } from '../systems/state/SaveLoad';
import { session } from '../systems/state/session';
import { Menu } from '../ui/Menu';
import { text } from '../ui/Window';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const controls = new Controls(this);
    createBattleBackground(this, { colors: ['#14303a', '#241a2e', '#2c4a24'], mode: 1, speed: 0.4, freq: 0.6 }, 320, 240, 0.9);

    // Pond + Okee
    const pond = this.add.graphics();
    pond.fillStyle(0x0b1e26, 1).fillEllipse(160, 196, 220, 48);
    pond.fillStyle(0x14303a, 1).fillEllipse(160, 196, 200, 40);
    const okee = this.add.sprite(160, 190, 'okee', 0).setScale(3).setOrigin(0.5, 1);
    this.tweens.add({ targets: okee, y: 193, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const title = this.add.bitmapText(160, 40, FONT_KEY, 'SWAMPLIGHT').setOrigin(0.5).setScale(3);
    title.setTint(0xf2c14e);
    const shadow = this.add.bitmapText(162, 42, FONT_KEY, 'SWAMPLIGHT').setOrigin(0.5).setScale(3).setTint(0x6b3f8f);
    shadow.setDepth(-1);
    title.setDepth(1);
    this.tweens.add({ targets: [title], y: 38, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    text(this, 160, 68, 'a Florida cryptid RPG', UI.dim).setOrigin(0.5);

    const prompt = text(this, 160, 126, 'PRESS Z', UI.text).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    text(this, 4, 230, 'v0.1 MVP', UI.dim);

    const start = async () => {
      sound.unlock();
      sound.music('town');
      prompt.destroy();
      const items = [{ label: 'New Game' }, { label: 'Continue', disabled: !hasSave() }];
      const choice = await new Menu(this, controls, items, { x: 112, y: 104, w: 96, cancelable: false, start: hasSave() ? 1 : 0 }).open();
      if (choice === 0) session.gs = new GameState(newGame());
      else session.gs = new GameState(loadGame() ?? newGame());
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const d = session.gs.data;
        this.scene.start('Overworld', { mapId: d.mapId, x: d.x, y: d.y, facing: d.facing });
      });
    };
    const h = (a: string) => {
      if (a === 'confirm') {
        controls.pop(h);
        void start();
      }
    };
    controls.push(h);
    this.input.once('pointerdown', () => {
      controls.pop(h);
      void start();
    });
  }
}
