import Phaser from 'phaser';
import { hexToRgb } from '../../art/palette';
import type { BattleBg } from '../../data/enemies';

const FRAG = `
precision mediump float;
uniform float time;
uniform vec2 resolution;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform float uMode;
uniform float uSpeed;
uniform float uFreq;
uniform float uDim;
varying vec2 fragCoord;

void main() {
  vec2 px = floor(fragCoord.xy);
  vec2 p = px / resolution.xy;
  float t = time * uSpeed;
  // Per-scanline horizontal oscillation, with interlaced rows going the other way.
  float dir = mod(px.y, 2.0) < 1.0 ? 1.0 : -1.0;
  float x = p.x + 0.035 * dir * sin(p.y * 24.0 * uFreq + t * 2.7);
  float y = p.y + 0.03 * sin(p.x * 13.0 + t * 1.7);
  float v;
  if (uMode < 0.5) {
    v = sin((x + y) * uFreq * 22.0 + t * 3.0);
  } else if (uMode < 1.5) {
    vec2 c = vec2(x - 0.5, (y - 0.5) * 0.75);
    v = sin(length(c) * uFreq * 46.0 - t * 4.0);
  } else if (uMode < 2.5) {
    v = sin(x * uFreq * 28.0 + t) * sin(y * uFreq * 26.0 - t * 1.3) + 0.4 * sin(t + x * 9.0);
  } else {
    vec2 g = floor(vec2(x, y + 0.08 * sin(x * 10.0 + t)) * uFreq * 12.0);
    v = mod(g.x + g.y, 2.0) * 1.2 - 0.6 + 0.4 * sin(t * 2.0 + g.x * 0.7);
  }
  float band = fract(v * 0.35 + 0.5 + t * 0.12);
  vec3 col = band < 0.333 ? uColA : (band < 0.666 ? uColB : uColC);
  col *= mod(px.y, 2.0) < 1.0 ? 1.0 : 0.82;
  gl_FragColor = vec4(col * uDim, 1.0);
}
`;

function vec(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return { x: r / 255, y: g / 255, z: b / 255 };
}

/**
 * Earthbound-style psychedelic backdrop. Uses a fragment shader on WebGL and
 * falls back to a scrolling striped tile-sprite on the canvas renderer.
 */
export function createBattleBackground(scene: Phaser.Scene, bg: BattleBg, w = 320, h = 240, dim = 1): Phaser.GameObjects.GameObject {
  if (scene.game.renderer.type === Phaser.WEBGL) {
    const base = new Phaser.Display.BaseShader('battlebg', FRAG, undefined, {
      uColA: { type: '3f', value: vec(bg.colors[0]) },
      uColB: { type: '3f', value: vec(bg.colors[1]) },
      uColC: { type: '3f', value: vec(bg.colors[2]) },
      uMode: { type: '1f', value: bg.mode },
      uSpeed: { type: '1f', value: bg.speed },
      uFreq: { type: '1f', value: bg.freq },
      uDim: { type: '1f', value: dim },
    });
    return scene.add.shader(base, 0, 0, w, h).setOrigin(0, 0);
  }
  const key = `bgfallback_${bg.colors.join('')}`;
  if (!scene.textures.exists(key)) {
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext('2d')!;
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = bg.colors[Math.floor(i / 8)];
      for (let k = 0; k < 24; k++) ctx.fillRect((i + k) % 24, k, 1, 1);
    }
    scene.textures.addCanvas(key, c);
  }
  const ts = scene.add.tileSprite(0, 0, w, h, key).setOrigin(0, 0).setAlpha(dim);
  scene.events.on('update', (_t: number, dt: number) => {
    ts.tilePositionX += dt * 0.02 * bg.speed;
    ts.tilePositionY += dt * 0.01 * bg.speed;
  });
  return ts;
}
