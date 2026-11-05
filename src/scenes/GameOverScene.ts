import Phaser from 'phaser';
import { UI } from '../art/palette';
import { sound } from '../systems/audio/Sound';
import { Controls } from '../systems/input/Controls';
import { GameState, newGame } from '../systems/state/GameState';
import { loadGame } from '../systems/state/SaveLoad';
import { session } from '../systems/state/session';
import { Menu } from '../ui/Menu';
import { text } from '../ui/Window';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(): void {
    sound.stopMusic();
    sound.sfx('lose');
    this.cameras.main.setBackgroundColor('#0b0710');
    const controls = new Controls(this);
    const g = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      g.lineStyle(1, 0x14303a, 1 - i * 0.15);
      g.strokeEllipse(160, 120, 40 + i * 30, 10 + i * 8);
    }
    const t = text(this, 160, 60, 'THE POND IS QUIET.', UI.danger).setOrigin(0.5).setAlpha(0);
    const t2 = text(this, 160, 76, 'Okee sinks below the surface.', UI.dim).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [t, t2], alpha: 1, duration: 1200 });
    this.time.delayedCall(1500, async () => {
      const save = loadGame();
      const choice = await new Menu(this, controls, [{ label: save ? 'Rise again' : 'Start over' }, { label: 'Title' }], { x: 112, y: 160, w: 96, cancelable: false }).open();
      if (choice === 0) {
        session.gs = new GameState(save ?? newGame());
        if (save) session.gs.data.money = Math.floor(session.gs.data.money / 2);
        session.gs.healAll();
        const d = session.gs.data;
        this.scene.start('Overworld', { mapId: d.mapId, x: d.x, y: d.y, facing: d.facing });
      } else this.scene.start('Title');
    });
  }
}
