import Phaser from 'phaser';
import { xpForLevel } from '../data/party';
import { GameState, newGame } from '../systems/state/GameState';
import { session } from '../systems/state/session';

/**
 * Developer entry points, e.g.
 *   ?debug=map:plaza1:14:16   jump to a map position
 *   ?debug=battle:boss&lvl=8  start a battle
 *   ?debug=ending             roll credits
 * Optional: &lvl=N sets party level, &ibis=1 adds Brother Ibis, &dolores=1 adds Dolores,
 * &flags=a,b sets flags.
 */
export class DebugScene extends Phaser.Scene {
  constructor() {
    super('Debug');
  }

  create(data: { cmd: string; params: URLSearchParams }): void {
    const p = data.params;
    const gs = new GameState(newGame());
    session.gs = gs;
    const lvl = Number(p.get('lvl') ?? 1);
    for (const f of (p.get('flags') ?? '').split(',').filter(Boolean)) gs.setFlag(f);
    if (p.get('ibis')) {
      gs.addMember('ibis');
      gs.setFlag('ibisJoined');
    }
    if (p.get('dolores')) {
      gs.addMember('dolores');
      gs.setFlag('doloresJoined');
      gs.setFlag('lakeCleared');
      gs.setFlag('lionfishDefeated');
    }
    if (lvl > 1) gs.gainXp(xpForLevel(lvl), gs.data.party.map((m) => m.id));
    gs.healAll();
    gs.addItem('peanuts', 3);
    gs.addItem('rocket', 2);
    gs.addItem('coffee', 1);

    const [kind, a, b, c] = data.cmd.split(':');
    if (kind === 'map') {
      this.scene.start('Overworld', { mapId: a ?? 'town', x: Number(b ?? 10), y: Number(c ?? 22), facing: 'down' });
    } else if (kind === 'battle') {
      this.scene.start('Overworld', { mapId: 'plaza1', x: 14, y: 16, facing: 'up' });
      window.setTimeout(() => {
        const ow = this.scene.get('Overworld') as unknown as { startBattle: (g: string, adv: string) => Promise<unknown> };
        void ow.startBattle(a ?? 'tourist1', 'none');
      }, 600);
    } else if (kind === 'ending') {
      this.scene.start('Ending');
    } else this.scene.start('Title');
  }
}
