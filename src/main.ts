import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { DebugScene } from './scenes/DebugScene';
import { EndingScene } from './scenes/EndingScene';
import { GameOverScene } from './scenes/GameOverScene';
import { OverworldScene } from './scenes/OverworldScene';
import { TitleScene } from './scenes/TitleScene';

const W = 320;
const H = 240;

function zoomFor(): number {
  const z = Math.min(window.innerWidth / W, window.innerHeight / H);
  return z >= 1 ? Math.floor(z) : z;
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0b0710',
  scale: { mode: Phaser.Scale.NONE, zoom: zoomFor(), autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, OverworldScene, BattleScene, GameOverScene, EndingScene, DebugScene],
});

window.addEventListener('resize', () => game.scale.setZoom(zoomFor()));
(window as unknown as { __GAME?: Phaser.Game }).__GAME = game;
