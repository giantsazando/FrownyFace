import Phaser from 'phaser';
import { UI } from '../art/palette';
import { sound } from '../systems/audio/Sound';
import { createBattleBackground } from '../systems/battle/BattleBackground';
import { Controls } from '../systems/input/Controls';
import { saveGame } from '../systems/state/SaveLoad';
import { session } from '../systems/state/session';
import { text } from '../ui/Window';

const LINES = [
  'Palmetto Hollow wakes up.',
  'Nobody remembers the night.',
  '',
  'Everglow Plaza is still dead.',
  'It is the regular kind of dead now.',
  '',
  'The HOA files a complaint about the pond.',
  'Pastor Dale preaches to a parking lot that finally listens.',
  'A mailbox waits. It is good at waiting.',
  '',
  "Tyler's photo has a second blur in it:",
  'something white, with a long curved beak.',
  '',
  'Somewhere, a payphone is ringing.',
  '',
  '',
  'SWAMPLIGHT',
  '',
  'Okee ............. herself',
  'Brother Ibis ..... himself',
  'The Anchor Tenant  (closed)',
  '',
  'Made of code, pixels, and humidity.',
  '',
  'To be continued.',
  '',
  'Thank you for playing.',
];

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create(): void {
    sound.music('ending');
    const controls = new Controls(this);
    createBattleBackground(this, { colors: ['#0b1e26', '#14303a', '#241a2e'], mode: 1, speed: 0.25, freq: 0.5 }, 320, 240, 0.8);
    const okee = this.add.sprite(130, 230, 'okee', 0).setScale(2).setOrigin(0.5, 1);
    const ibis = this.add.sprite(190, 230, 'ibis', 0).setScale(2).setOrigin(0.5, 1).setFlipX(true);
    this.tweens.add({ targets: [okee, ibis], y: 226, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.inOut' });

    const container = this.add.container(0, 250);
    LINES.forEach((l, i) => {
      const col = l === 'SWAMPLIGHT' ? UI.accent : UI.text;
      const t = text(this, 160, i * 14, l, col).setOrigin(0.5, 0);
      if (l === 'SWAMPLIGHT') t.setScale(2);
      container.add(t);
    });
    const total = LINES.length * 14 + 260;

    // Persist the finished game so Continue lets you wander the quiet town.
    const d = session.gs.data;
    d.mapId = 'town';
    d.x = 10;
    d.y = 22;
    d.facing = 'down';
    session.gs.healAll();
    saveGame(d);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.cameras.main.fadeOut(1200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    };
    this.tweens.add({ targets: container, y: 250 - total + 120, duration: total * 55, ease: 'Linear', onComplete: () => this.time.delayedCall(2500, finish) });
    // hold confirm to speed up, cancel skips
    controls.push((a) => {
      if (a === 'cancel') finish();
    });
    this.events.on('update', () => {
      this.tweens.timeScale = controls.isDown('confirm') ? 4 : 1;
    });
  }
}
