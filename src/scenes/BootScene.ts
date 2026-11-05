import Phaser from 'phaser';
import { addGridSheet, buildFont, buildLightTexture, paintTexture } from '../art/pixelArt';
import { ENEMY_MAP_SPRITES, IBIS_FRAMES, NPC_SPRITES, OBJECT_SPRITES, OKEE_FRAMES } from '../art/sprites/characters';
import { BATTLERS } from '../art/sprites/battlers';
import { DECOR } from '../art/sprites/decor';
import { paintTileset } from '../art/sprites/tiles';
import { TILE_NAMES } from '../data/tiles';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    buildFont(this);
    this.textures.addCanvas('tiles', paintTileset(TILE_NAMES));

    addGridSheet(this, 'okee', OKEE_FRAMES);
    addGridSheet(this, 'ibis', IBIS_FRAMES);
    for (const [k, g] of Object.entries(NPC_SPRITES)) addGridSheet(this, `npc_${k}`, [g]);
    for (const [k, fs] of Object.entries(OBJECT_SPRITES)) addGridSheet(this, `obj_${k}`, fs);
    for (const [k, fs] of Object.entries(ENEMY_MAP_SPRITES)) addGridSheet(this, `enemy_${k}`, fs);
    for (const [k, d] of Object.entries(DECOR)) paintTexture(this, `decor_${k}`, d.w, d.h, d.paint, d.frames);
    for (const [k, b] of Object.entries(BATTLERS)) paintTexture(this, `battler_${k}`, b.w, b.h, b.paint, b.frames);

    buildLightTexture(this, 'light_s', 20);
    buildLightTexture(this, 'light_m', 36);
    buildLightTexture(this, 'light_l', 56);

    this.anims.create({ key: 'okee-down', frames: this.anims.generateFrameNumbers('okee', { frames: [0, 1] }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'okee-up', frames: this.anims.generateFrameNumbers('okee', { frames: [2, 3] }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'okee-side', frames: this.anims.generateFrameNumbers('okee', { frames: [4, 5] }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'ibis-walk', frames: this.anims.generateFrameNumbers('ibis', { frames: [0, 1] }), frameRate: 6, repeat: -1 });

    const params = new URLSearchParams(location.search);
    const debug = params.get('debug');
    if (debug) {
      this.scene.start('Debug', { cmd: debug, params });
      return;
    }
    this.scene.start('Title');
  }
}
