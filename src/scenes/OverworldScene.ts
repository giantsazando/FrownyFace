import Phaser from 'phaser';
import { UI } from '../art/palette';
import { SCRIPTS, type Step } from '../data/dialogue/scripts';
import { ENCOUNTER_GROUPS, ENEMIES } from '../data/enemies';
import { ITEMS, SHOPS } from '../data/items';
import { MAPS, type Cond, type Entity, type MapDef } from '../data/maps';
import { MEMBERS, type MemberId, skillsAt, statsAt, xpForLevel } from '../data/party';
import { SKILLS } from '../data/skills';
import { TILE_DEFS, TILE_NAMES, tileVariant } from '../data/tiles';
import { sound } from '../systems/audio/Sound';
import type { Advantage, Outcome } from '../systems/battle/BattleEngine';
import { Controls, type Handler } from '../systems/input/Controls';
import type { Facing } from '../systems/state/GameState';
import { saveGame } from '../systems/state/SaveLoad';
import { session } from '../systems/state/session';
import { CANCELLED, Menu } from '../ui/Menu';
import { TextBox } from '../ui/TextBox';
import { Panel } from '../ui/Window';

const TS = 16;
const SPEED = 74;
const DIRS: Record<Facing, { x: number; y: number }> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

interface Live {
  def: Entity;
  sprite?: Phaser.GameObjects.Sprite;
  x: number; // feet position (px)
  y: number;
  solid: boolean;
  // movers
  vx: number;
  vy: number;
  timer: number;
  cooldown: number;
  homeX: number;
  homeY: number;
}

interface Light {
  x: number;
  y: number;
  key: string;
  r: number;
  flicker?: boolean;
  off?: number;
  follow?: Phaser.GameObjects.Sprite;
}

export interface OverworldData {
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
}

function condOk(c: Cond): boolean {
  const gs = session.gs;
  if (c.requires && !gs.flag(c.requires)) return false;
  if (c.unless && gs.flag(c.unless)) return false;
  return true;
}

export class OverworldScene extends Phaser.Scene {
  private map!: MapDef;
  private controls!: Controls;
  private textbox!: TextBox;
  private player!: Phaser.GameObjects.Sprite;
  private followers: { id: MemberId; sprite: Phaser.GameObjects.Sprite }[] = [];
  private trail: { x: number; y: number; moving: boolean }[] = [];
  private facing: Facing = 'down';
  private entities: Live[] = [];
  private glows: Light[] = [];
  private dark!: Phaser.GameObjects.RenderTexture;
  private scriptDepth = 0;
  private transitioning = false;
  private lastTile = '';
  private invuln = 0;
  private grace = 0;
  private defeated = new Set<string>();
  private waterTiles: { x: number; y: number }[] = [];
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private baseHandler!: Handler;

  constructor() {
    super('Overworld');
  }

  init(data: OverworldData): void {
    this.map = MAPS[data.mapId] ?? MAPS.town;
    this.facing = data.facing ?? 'down';
    this.entities = [];
    this.glows = [];
    this.trail = [];
    this.followers = [];
    this.scriptDepth = 0;
    this.transitioning = false;
    this.invuln = 0;
    this.grace = 1.5;
    this.defeated = new Set();
    this.waterTiles = [];
    this.lastTile = `${data.x},${data.y}`;
    session.gs.data.mapId = this.map.id;
    this.registry.set('spawn', data);
  }

  create(): void {
    const data = this.registry.get('spawn') as OverworldData;
    this.controls = new Controls(this);
    this.cameras.main.setBackgroundColor('#0b0710');
    this.buildTilemap();
    this.buildDecor();

    // player
    this.player = this.add.sprite(data.x * TS + 8, data.y * TS + 15, 'okee', 0).setOrigin(0.5, 1);
    this.setFacingFrame(false);
    // In the darkest places Okee's eyeshine carries further, so the layout stays readable.
    const big = this.map.darkness >= 0.8;
    this.glows.push({ x: 0, y: 0, key: big ? 'light_l' : 'light_m', r: big ? 56 : 36, follow: this.player });
    for (const m of session.gs.data.party) if (m.id !== 'okee') this.spawnFollower(m.id);
    for (let i = 0; i < 32; i++) this.trail.push({ x: this.player.x, y: this.player.y, moving: false });

    for (const def of this.map.entities) this.spawnEntity(def);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.tiles[0].length * TS, this.map.tiles.length * TS);
    cam.startFollow(this.player, true, 1, 1);
    cam.setRoundPixels(true);

    this.dark = this.add.renderTexture(0, 0, 320, 240).setOrigin(0, 0).setScrollFactor(0).setDepth(1200);

    this.textbox = new TextBox(this, this.controls, { x: 8, y: 180, w: 304, lines: 4 });

    this.baseHandler = (a) => {
      if (this.busy) return;
      if (a === 'confirm') this.interact();
      else if (a === 'cancel') void this.openMenu();
    };
    this.controls.push(this.baseHandler);

    sound.music(this.map.music);
    this.showMapName();
    this.resetCamera();
    cam.fadeIn(350, 0, 0, 0);

    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this.animateWater(),
    });

    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      sound.music(this.map.music);
      this.resetCamera();
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });

    const enter = this.map.onEnter?.find((e) => condOk(e));
    if (enter) {
      const s = enter.script;
      this.scriptDepth++;
      this.time.delayedCall(450, async () => {
        this.scriptDepth--;
        await this.runScript(SCRIPTS[s]);
      });
    }

    (window as unknown as { __SWAMP?: unknown }).__SWAMP = { scene: this, session };
  }

  /** Undo any battle-transition camera effects so the view is always 1:1. */
  private resetCamera(): void {
    const cam = this.cameras.main;
    this.tweens.killTweensOf(cam);
    cam.resetFX();
    cam.setZoom(1);
  }

  get busy(): boolean {
    return this.scriptDepth > 0 || this.transitioning || this.controls.depth > 1;
  }

  // ---------------------------------------------------------------- world

  private buildTilemap(): void {
    const data = this.map.tiles.map((row, y) =>
      [...row].map((ch, x) => {
        if (ch === '~') this.waterTiles.push({ x, y });
        return TILE_NAMES.indexOf(tileVariant(ch, x, y));
      }),
    );
    const tm = this.make.tilemap({ data, tileWidth: TS, tileHeight: TS });
    const ts = tm.addTilesetImage('tiles', 'tiles', TS, TS, 0, 0)!;
    this.layer = tm.createLayer(0, ts, 0, 0)!.setDepth(-10);
  }

  private animateWater(): void {
    const a = TILE_NAMES.indexOf('water0');
    const b = TILE_NAMES.indexOf('water1');
    for (const w of this.waterTiles) {
      if (Math.random() < 0.35) {
        const t = this.layer.getTileAt(w.x, w.y);
        if (t) t.index = t.index === a ? b : a;
      }
    }
  }

  private buildDecor(): void {
    this.map.tiles.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const def = TILE_DEFS[ch];
        const cx = x * TS + 8;
        if (def.decor === 'palm' || def.decor === 'deadpalm') {
          this.add.sprite(cx, y * TS + 16, `decor_${def.decor}`).setOrigin(0.5, 1).setDepth(y * TS + 15);
        } else if (def.decor === 'lamp') {
          this.add.sprite(cx, y * TS + 16, 'decor_lamp').setOrigin(0.5, 1).setDepth(y * TS + 15);
          this.glows.push({ x: cx, y: y * TS - 16, key: 'light_l', r: 56 });
        } else if (def.decor === 'flourescent') {
          const s = this.add.sprite(cx, y * TS - 22, 'decor_flourescent', 0).setDepth(1100);
          const light: Light = { x: cx, y: y * TS + 4, key: 'light_m', r: 36, flicker: true, off: 0 };
          this.glows.push(light);
          this.events.on('update', () => s.setFrame(light.off && light.off > 0 ? 1 : 0));
        } else if (def.light) {
          if (ch === 'n' && (x + y) % 2) return;
          if (ch === 'G' && (x + y) % 3) return;
          this.glows.push({ x: cx, y: y * TS + 8, key: 'light_s', r: 20 });
        }
      }),
    );
  }

  private spawnFollower(id: MemberId): void {
    if (this.followers.some((f) => f.id === id)) return;
    const sprite = this.add.sprite(this.player.x, this.player.y, id, 0).setOrigin(0.5, 1);
    this.followers.push({ id, sprite });
  }

  private spawnEntity(def: Entity): void {
    if (!condOk(def)) return;
    if (def.kind === 'enemy' && this.defeated.has(def.id)) return;
    const x = def.x * TS + 8;
    const y = def.y * TS + 15;
    const live: Live = { def, x, y, solid: false, vx: 0, vy: 0, timer: 0, cooldown: 0, homeX: x, homeY: y };
    switch (def.kind) {
      case 'npc':
        live.sprite = this.add.sprite(x, y + 1, def.sprite, 0).setOrigin(0.5, 1).setFlipX(!!def.flip);
        live.solid = true;
        if (def.sprite === 'decor_bossMap' || def.sprite === 'decor_lionfishMap') {
          live.sprite.setScale(1.5);
          this.glows.push({ x, y: y - 20, key: 'light_l', r: 56, flicker: true, off: 0 });
          this.tweens.add({ targets: live.sprite, scaleY: 1.05, yoyo: true, repeat: -1, duration: 900 });
        } else if (def.sprite.startsWith('npc_')) {
          this.tweens.add({ targets: live.sprite, scaleY: 0.94, yoyo: true, repeat: -1, duration: 700 + Math.random() * 500, delay: Math.random() * 500 });
        }
        if (def.sprite.startsWith('decor_') && live.sprite.texture.frameTotal > 2) {
          const spr = live.sprite;
          this.time.addEvent({ delay: 380, loop: true, callback: () => spr.active && spr.setFrame((Number(spr.frame.name) + 1) % 2) });
        }
        if (def.sprite === 'decor_vending') this.glows.push({ x, y: y - 10, key: 'light_s', r: 20 });
        break;
      case 'sign':
        if (def.sprite) {
          const spr = this.add.sprite(x, y + 1, def.sprite, 0).setOrigin(0.5, 1);
          live.sprite = spr;
          live.solid = true;
          if (spr.texture.frameTotal > 2) {
            this.time.addEvent({ delay: 300, loop: true, callback: () => spr.active && spr.setFrame((Number(spr.frame.name) + 1) % 2) });
          }
        }
        break;
      case 'cooler':
        live.sprite = this.add.sprite(x, y + 1, 'obj_cooler', session.gs.flag(`cooler_${def.id}`) ? 1 : 0).setOrigin(0.5, 1);
        live.solid = true;
        break;
      case 'payphone':
        live.sprite = this.add.sprite(x, y + 1, 'obj_payphone').setOrigin(0.5, 1);
        live.solid = true;
        this.glows.push({ x, y: y - 10, key: 'light_s', r: 20 });
        break;
      case 'enemy':
        live.sprite = this.add.sprite(x, y, def.sprite, 0).setOrigin(0.5, 1);
        break;
      case 'warp':
        break;
    }
    this.entities.push(live);
  }

  /** Re-evaluate conditional entities after a flag changes. */
  private refreshEntities(): void {
    for (const e of [...this.entities]) {
      if (!condOk(e.def)) {
        e.sprite?.destroy();
        this.entities.splice(this.entities.indexOf(e), 1);
      }
    }
    for (const def of this.map.entities) {
      if (def.kind === 'enemy' && this.defeated.has(def.id)) continue;
      if (condOk(def) && !this.entities.some((e) => e.def === def)) this.spawnEntity(def);
    }
  }

  private tileSolid(px: number, py: number): boolean {
    const tx = Math.floor(px / TS);
    const ty = Math.floor(py / TS);
    const ch = this.map.tiles[ty]?.[tx];
    if (ch === undefined) return true;
    return TILE_DEFS[ch].solid;
  }

  private blocked(fx: number, fy: number, self?: Live): boolean {
    const pts = [
      [fx - 5, fy - 6],
      [fx + 4, fy - 6],
      [fx - 5, fy - 1],
      [fx + 4, fy - 1],
    ];
    if (pts.some(([x, y]) => this.tileSolid(x, y))) return true;
    for (const e of this.entities) {
      if (!e.solid || e === self) continue;
      const l = e.x - 7;
      const r = e.x + 7;
      const t = e.y - 9;
      const b = e.y + 1;
      if (fx + 4 >= l && fx - 5 <= r && fy - 1 >= t && fy - 6 <= b) return true;
    }
    return false;
  }

  private moveActor(x: number, y: number, dx: number, dy: number, self?: Live): { x: number; y: number } {
    let nx = x;
    let ny = y;
    if (dx && !this.blocked(x + dx, y, self)) nx = x + dx;
    if (dy && !this.blocked(nx, y + dy, self)) ny = y + dy;
    return { x: nx, y: ny };
  }

  // ---------------------------------------------------------------- update

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    this.invuln = Math.max(0, this.invuln - dt);
    if (!this.busy) this.grace = Math.max(0, this.grace - dt);
    this.player.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 10) % 2 ? 0.4 : 1);

    let moving = false;
    if (!this.busy) {
      let vx = 0;
      let vy = 0;
      if (this.controls.isDown('left')) vx -= 1;
      if (this.controls.isDown('right')) vx += 1;
      if (this.controls.isDown('up')) vy -= 1;
      if (this.controls.isDown('down')) vy += 1;
      if (vx || vy) {
        const len = Math.hypot(vx, vy);
        const step = SPEED * dt;
        if (vx && !vy) this.facing = vx < 0 ? 'left' : 'right';
        else if (vy && !vx) this.facing = vy < 0 ? 'up' : 'down';
        else if (!this.isFacingAlong(vx, vy)) this.facing = vy < 0 ? 'up' : 'down';
        const p = this.moveActor(this.player.x, this.player.y, (vx / len) * step, (vy / len) * step);
        moving = p.x !== this.player.x || p.y !== this.player.y;
        this.player.setPosition(p.x, p.y);
      }
    }
    this.setFacingFrame(moving);
    if (moving) {
      this.trail.push({ x: this.player.x, y: this.player.y, moving: true });
      if (this.trail.length > 64) this.trail.shift();
    }
    this.updateFollower(moving);
    if (!this.busy) this.checkWarps();
    this.updateMovers(dt);

    for (const e of this.entities) e.sprite?.setDepth(e.y);
    this.player.setDepth(this.player.y);
    this.followers.forEach((f, k) => f.sprite.setDepth(f.sprite.y - 0.5 - k * 0.1));

    this.drawDarkness(dt);
  }

  private isFacingAlong(vx: number, vy: number): boolean {
    const d = DIRS[this.facing];
    return (d.x !== 0 && Math.sign(d.x) === Math.sign(vx)) || (d.y !== 0 && Math.sign(d.y) === Math.sign(vy));
  }

  private setFacingFrame(moving: boolean): void {
    const anim = this.facing === 'up' ? 'okee-up' : this.facing === 'down' ? 'okee-down' : 'okee-side';
    this.player.setFlipX(this.facing === 'left');
    if (moving) {
      if (this.player.anims.currentAnim?.key !== anim || !this.player.anims.isPlaying) this.player.play(anim, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(this.facing === 'up' ? 2 : this.facing === 'down' ? 0 : 4);
    }
  }

  private updateFollower(moving: boolean): void {
    this.followers.forEach(({ id, sprite }, k) => {
      const t = this.trail[Math.max(0, this.trail.length - 14 * (k + 1))];
      const dx = t.x - sprite.x;
      if (Math.abs(dx) > 0.2) sprite.setFlipX(dx < 0);
      sprite.setPosition(t.x, t.y);
      if (moving) {
        if (!sprite.anims.isPlaying) sprite.play(`${id}-walk`);
      } else {
        sprite.anims.stop();
        sprite.setFrame(0);
      }
    });
  }

  private updateMovers(dt: number): void {
    const px = this.player.x;
    const py = this.player.y;
    const now = this.time.now;
    for (const e of [...this.entities]) {
      const isEnemy = e.def.kind === 'enemy';
      const wanders = isEnemy || (e.def.kind === 'npc' && e.def.wander);
      if (!wanders || !e.sprite) continue;
      e.cooldown = Math.max(0, e.cooldown - dt);
      if (isEnemy) e.sprite.setAlpha(e.cooldown > 0 && Math.floor(e.cooldown * 8) % 2 ? 0.3 : 1);
      if (this.busy) continue;
      const dist = Math.hypot(px - e.x, py - e.y);
      let speed = 18;
      if (isEnemy && e.cooldown <= 0 && dist < 72) {
        speed = this.map.id === 'town' ? 30 : 40;
        e.vx = (px - e.x) / dist;
        e.vy = (py - e.y) / dist;
      } else {
        e.timer -= dt;
        if (e.timer <= 0) {
          e.timer = 0.8 + Math.random() * 1.6;
          const homeDist = Math.hypot(e.homeX - e.x, e.homeY - e.y);
          if (homeDist > 40) {
            e.vx = (e.homeX - e.x) / homeDist;
            e.vy = (e.homeY - e.y) / homeDist;
          } else if (Math.random() < 0.35) {
            e.vx = 0;
            e.vy = 0;
          } else {
            const a = Math.random() * Math.PI * 2;
            e.vx = Math.cos(a);
            e.vy = Math.sin(a);
          }
        }
      }
      if (e.vx || e.vy) {
        const p = this.moveActor(e.x, e.y, e.vx * speed * dt, e.vy * speed * dt, e);
        e.x = p.x;
        e.y = p.y;
        e.sprite.setPosition(e.x, e.y + (e.def.kind === 'npc' ? 1 : 0));
        if (Math.abs(e.vx) > 0.1) e.sprite.setFlipX(e.vx < 0);
      }
      if (isEnemy && e.sprite.texture.frameTotal > 2) e.sprite.setFrame(Math.floor(now / 280) % 2);
      if (isEnemy && e.cooldown <= 0 && this.invuln <= 0 && this.grace <= 0 && dist < 11) {
        void this.encounter(e);
        return;
      }
    }
  }

  private drawDarkness(dt: number): void {
    const cam = this.cameras.main;
    const sx = Math.round(cam.scrollX);
    const sy = Math.round(cam.scrollY);
    this.dark.clear();
    this.dark.fill(this.map.tint, this.map.darkness);
    for (const l of this.glows) {
      const lx = l.follow ? l.follow.x : l.x;
      const ly = l.follow ? l.follow.y - 8 : l.y;
      if (lx < sx - l.r || lx > sx + 320 + l.r || ly < sy - l.r || ly > sy + 240 + l.r) continue;
      if (l.flicker) {
        l.off = Math.max(0, (l.off ?? 0) - dt);
        if (l.off <= 0 && Math.random() < 0.006) l.off = 0.05 + Math.random() * 0.25;
        if (l.off > 0) continue;
      }
      this.dark.erase(l.key, Math.round(lx - sx - l.r), Math.round(ly - sy - l.r));
    }
  }

  // ---------------------------------------------------------------- warps & interaction

  private playerTile(): { x: number; y: number } {
    return { x: Math.floor(this.player.x / TS), y: Math.floor((this.player.y - 1) / TS) };
  }

  private checkWarps(): void {
    const t = this.playerTile();
    const key = `${t.x},${t.y}`;
    if (key === this.lastTile) return;
    this.lastTile = key;
    for (const e of this.entities) {
      const d = e.def;
      if (d.kind !== 'warp') continue;
      if (t.x >= d.x && t.x < d.x + (d.w ?? 1) && t.y >= d.y && t.y < d.y + (d.h ?? 1)) {
        void this.warp(d);
        return;
      }
    }
  }

  private async warp(d: Extract<Entity, { kind: 'warp' }>): Promise<void> {
    if (!condOk(d)) {
      const back = DIRS[this.facing];
      this.player.setPosition(this.player.x - back.x * 6, this.player.y - back.y * 6);
      this.lastTile = '';
      if (d.blocked) await this.runScript(SCRIPTS[d.blocked]);
      return;
    }
    this.transitioning = true;
    sound.sfx('door');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ mapId: d.to, x: d.tx, y: d.ty, facing: d.facing } as OverworldData);
    });
  }

  private interact(): void {
    const d = DIRS[this.facing];
    const px = this.player.x + d.x * 14;
    const py = this.player.y - 5 + d.y * 14;
    for (const e of this.entities) {
      const k = e.def.kind;
      if (k === 'warp' || k === 'enemy') continue;
      if (px >= e.x - 9 && px <= e.x + 9 && py >= e.y - 16 && py <= e.y + 2) {
        void this.activate(e);
        return;
      }
    }
  }

  private async activate(e: Live): Promise<void> {
    const d = e.def;
    if (d.kind === 'npc' || d.kind === 'sign') {
      if (d.kind === 'npc' && d.sprite === 'npc_ibisStatic') e.sprite?.setFlipX(this.player.x < e.x);
      await this.runScript(SCRIPTS[d.script]);
    } else if (d.kind === 'payphone') {
      await this.runScript(SCRIPTS.payphone);
    } else if (d.kind === 'cooler') {
      const flag = `cooler_${d.id}`;
      if (session.gs.flag(flag)) {
        await this.runScript(['The cooler is empty. It smells like old ice.']);
        return;
      }
      session.gs.setFlag(flag);
      e.sprite?.setFrame(1);
      sound.sfx('item');
      if (d.item) {
        session.gs.addItem(d.item);
        await this.runScript([`Okee opened the cooler. Inside: ${ITEMS[d.item].name}!`]);
      } else if (d.money) {
        session.gs.data.money += d.money;
        await this.runScript([`Okee opened the cooler. Inside: $${d.money}, damp.`]);
      }
    }
  }

  // ---------------------------------------------------------------- scripts

  async runScript(steps: Step[]): Promise<'ok' | 'abort'> {
    this.scriptDepth++;
    try {
      for (const s of steps) {
        const r = await this.runStep(s);
        if (r === 'abort') return 'abort';
      }
      return 'ok';
    } finally {
      this.scriptDepth--;
      if (this.scriptDepth === 0 && this.textbox) this.textbox.hide();
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  private async runStep(s: Step): Promise<'ok' | 'abort'> {
    const gs = session.gs;
    if (typeof s === 'string') {
      await this.textbox.say(s);
      return 'ok';
    }
    if ('say' in s) await this.textbox.say(s.say, s.who);
    else if ('choice' in s) {
      const i = await new Menu(this, this.controls, s.choice.map((label) => ({ label })), { x: 212, y: 120, w: 100, cancelable: true }).open();
      const branch = s.then[i === CANCELLED ? s.choice.length - 1 : i];
      return this.runScript(branch);
    } else if ('set' in s) {
      gs.setFlag(s.set);
      this.refreshEntities();
    } else if ('if' in s) {
      const branch = gs.flag(s.if) ? s.then : s.else;
      if (branch) return this.runScript(branch);
    } else if ('give' in s) {
      gs.addItem(s.give, s.n ?? 1);
      sound.sfx('item');
    } else if ('money' in s) gs.data.money += s.money;
    else if ('heal' in s) gs.healAll();
    else if ('save' in s) this.save();
    else if ('shop' in s) await this.openShop(s.shop);
    else if ('battle' in s) {
      const outcome = await this.startBattle(s.battle, 'none');
      if (outcome !== 'win') return 'abort';
    } else if ('join' in s) {
      gs.addMember(s.join);
      this.spawnFollower(s.join);
      this.trail = this.trail.map(() => ({ x: this.player.x, y: this.player.y, moving: false }));
    } else if ('sfx' in s) sound.sfx(s.sfx);
    else if ('shake' in s) {
      this.cameras.main.shake(400, 0.012);
      await this.wait(400);
    } else if ('flash' in s) this.cameras.main.flash(s.flash);
    else if ('wait' in s) await this.wait(s.wait);
    else if ('music' in s) sound.music(s.music);
    else if ('warp' in s) {
      this.transitioning = true;
      this.textbox.hide();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      await this.wait(450);
      this.scene.restart({ mapId: s.warp, x: s.x, y: s.y, facing: s.facing } as OverworldData);
      return 'abort';
    } else if ('ending' in s) {
      this.transitioning = true;
      this.textbox.hide();
      this.cameras.main.fadeOut(1500, 255, 255, 255);
      await this.wait(1600);
      this.scene.start('Ending');
      return 'abort';
    }
    return 'ok';
  }

  private save(): void {
    const t = this.playerTile();
    const d = session.gs.data;
    d.mapId = this.map.id;
    d.x = t.x;
    d.y = t.y;
    d.facing = this.facing;
    saveGame(d);
  }

  // ---------------------------------------------------------------- battle

  private advantageFor(e: Live): Advantage {
    const dx = this.player.x - e.x;
    const dy = this.player.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    const toPlayer = { x: dx / len, y: dy / len };
    const ef = Math.hypot(e.vx, e.vy) || 1;
    const enemyDot = (e.vx / ef) * toPlayer.x + (e.vy / ef) * toPlayer.y;
    if ((e.vx || e.vy) && enemyDot < -0.3) return 'party';
    const pf = DIRS[this.facing];
    const playerDot = pf.x * -toPlayer.x + pf.y * -toPlayer.y;
    if (playerDot < -0.3) return 'enemy';
    return 'none';
  }

  private async encounter(e: Live): Promise<void> {
    const d = e.def as Extract<Entity, { kind: 'enemy' }>;
    const outcome = await this.startBattle(d.group, this.advantageFor(e));
    if (outcome === 'win') {
      this.defeated.add(d.id);
      e.sprite?.destroy();
      this.entities.splice(this.entities.indexOf(e), 1);
      this.invuln = 1;
    } else if (outcome === 'fled') {
      e.cooldown = 3;
      this.invuln = 3;
    }
  }

  startBattle(group: string, advantage: Advantage): Promise<Outcome> {
    this.transitioning = true;
    return new Promise((resolve) => {
      sound.sfx('encounter');
      sound.music(ENCOUNTER_GROUPS[group].some((id) => ENEMIES[id].boss) ? 'boss' : 'battle');
      const cam = this.cameras.main;
      cam.flash(120, 255, 255, 255);
      cam.shake(350, 0.01);
      const zoomTween = this.tweens.add({ targets: cam, zoom: 1.6, duration: 450, ease: 'Quad.in' });
      cam.fadeOut(450, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        // The fade can finish a frame before the zoom tween; stop the tween so it
        // can't re-apply the zoom after the battle resumes this scene.
        zoomTween.stop();
        cam.setZoom(1);
        this.scene.launch('Battle', {
          group,
          advantage,
          onEnd: (o: Outcome) => {
            this.transitioning = false;
            resolve(o);
          },
        });
        this.scene.pause();
      });
    });
  }

  // ---------------------------------------------------------------- menus

  private showMapName(): void {
    const w = this.map.name.length * 6 + 16;
    const p = new Panel(this, 8, 8, w, 18, 1400);
    p.text(8, 5, this.map.name, UI.accent);
    p.container.setAlpha(0);
    this.tweens.add({ targets: p.container, alpha: 1, duration: 300, hold: 1800, yoyo: true, onComplete: () => p.destroy() });
  }

  private async pickMember(title: string): Promise<MemberId | null> {
    const party = session.gs.data.party;
    if (party.length === 1) return party[0].id;
    const i = await new Menu(
      this,
      this.controls,
      party.map((m) => {
        const s = statsAt(m.id, m.level);
        return { label: MEMBERS[m.id].name, right: `${m.hp}/${s.maxHp}` };
      }),
      { x: 150, y: 40, w: 150, title },
    ).open();
    return i === CANCELLED ? null : party[i].id;
  }

  async openMenu(): Promise<void> {
    this.scriptDepth++;
    try {
      let start = 0;
      for (;;) {
        const money = new Panel(this, 8, 60, 72, 18, 1600);
        money.text(8, 5, `$${session.gs.data.money}`, UI.accent);
        const i = await new Menu(this, this.controls, [{ label: 'Goods' }, { label: 'Status' }, { label: 'Close' }], { x: 8, y: 8, w: 72, start }).open();
        money.destroy();
        start = Math.max(0, i);
        if (i === 0) await this.goodsMenu();
        else if (i === 1) await this.statusScreen();
        else break;
      }
    } finally {
      this.scriptDepth--;
      this.textbox.hide();
    }
  }

  private async goodsMenu(): Promise<void> {
    let start = 0;
    for (;;) {
      const list = session.gs.itemList();
      if (!list.length) {
        await this.textbox.say('Your raincoat pockets are empty, except for pond water.');
        this.textbox.hide();
        return;
      }
      const i = await new Menu(
        this,
        this.controls,
        list.map((it) => ({ label: ITEMS[it.id].name, right: `x${it.count}`, disabled: !ITEMS[it.id].field })),
        { x: 84, y: 8, w: 150, maxRows: 8, start, title: 'Goods', onMove: (k) => this.textbox.set(ITEMS[list[k].id].desc) },
      ).open();
      this.textbox.hide();
      if (i === CANCELLED) return;
      start = i;
      const target = await this.pickMember('Use on?');
      if (!target) continue;
      const msg = session.gs.useFieldItem(list[i].id, target);
      sound.sfx('heal');
      await this.textbox.say(msg);
      this.textbox.hide();
    }
  }

  private async statusScreen(): Promise<void> {
    const gs = session.gs;
    const party = gs.data.party;
    const p = new Panel(this, 20, 14, 280, 24 + party.length * 66, 1700);
    party.forEach((m, k) => {
      const s = statsAt(m.id, m.level);
      const y = 8 + k * 66;
      const def = MEMBERS[m.id];
      p.text(10, y, `${def.name}  Lv ${m.level}`, UI.accent);
      p.text(10, y + 12, `HP   ${m.hp}/${s.maxHp}`);
      p.text(10, y + 23, `Murk ${m.murk}/${s.maxMurk}`);
      p.text(10, y + 34, `Off ${s.off}  Def ${s.def}  Spd ${s.spd}`);
      const next = xpForLevel(m.level + 1) - m.xp;
      p.text(10, y + 45, `Next level: ${next} XP`, UI.dim);
      const skills = skillsAt(m.id, m.level).map((id) => SKILLS[id].name);
      p.text(150, y + 12, `${def.skillMenu}:`, UI.dim);
      skills.forEach((n, j) => p.text(150, y + 23 + j * 11, n));
    });
    p.text(10, 8 + party.length * 66, `Money: $${gs.data.money}`, UI.accent);
    await this.controls.waitConfirm();
    p.destroy();
  }

  private async openShop(id: string): Promise<void> {
    const shop = SHOPS[id];
    let start = 0;
    for (;;) {
      const money = new Panel(this, 228, 8, 84, 18, 1600);
      money.text(8, 5, `$${session.gs.data.money}`, UI.accent);
      const i = await new Menu(
        this,
        this.controls,
        shop.items.map((it) => ({ label: ITEMS[it].name, right: `$${ITEMS[it].price}` })),
        { x: 8, y: 8, w: 200, title: shop.name, start, onMove: (k) => this.textbox.set(ITEMS[shop.items[k]].desc) },
      ).open();
      money.destroy();
      if (i === CANCELLED) {
        this.textbox.hide();
        return;
      }
      start = i;
      const item = ITEMS[shop.items[i]];
      if (session.gs.data.money < item.price) {
        sound.sfx('miss');
        await this.textbox.say("You don't have enough money. You check under the raincoat. Still no.");
      } else {
        session.gs.data.money -= item.price;
        session.gs.addItem(item.id);
        sound.sfx('buy');
        await this.textbox.say(`Bought ${item.name}.`);
      }
    }
  }
}
