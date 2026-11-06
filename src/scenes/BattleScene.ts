import Phaser from 'phaser';
import { hexToNum, UI } from '../art/palette';
import { BATTLERS } from '../art/sprites/battlers';
import { ENCOUNTER_GROUPS, ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { MEMBERS, skillsAt, statsAt } from '../data/party';
import { SKILLS } from '../data/skills';
import { sound } from '../systems/audio/Sound';
import { createBattleBackground } from '../systems/battle/BattleBackground';
import {
  type Advantage,
  BattleEngine,
  type BattleEvent,
  type Combatant,
  type Command,
  type Outcome,
} from '../systems/battle/BattleEngine';
import { Controls, type Handler } from '../systems/input/Controls';
import { session } from '../systems/state/session';
import { ABORTED, CANCELLED, Menu } from '../ui/Menu';
import { Odometer } from '../ui/Odometer';
import { TextBox } from '../ui/TextBox';
import { drawWindow, text } from '../ui/Window';

export interface BattleData {
  group: string;
  advantage: Advantage;
  onEnd: (o: Outcome) => void;
}

interface PartyBox {
  c: Combatant;
  container: Phaser.GameObjects.Container;
  g: Phaser.GameObjects.Graphics;
  hp: Odometer;
  murk: Odometer;
  status: Phaser.GameObjects.BitmapText;
  baseY: number;
}

const STATUS_TAG: Record<string, string> = { sunburn: 'BURN', venom: 'VENM', weak: 'WEAK', slow: 'SLOW', guarded: 'COLD' };

export class BattleScene extends Phaser.Scene {
  private engine!: BattleEngine;
  private controls!: Controls;
  private textbox!: TextBox;
  private boxes: PartyBox[] = [];
  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();
  private pendingKO: Combatant[] = [];
  private activeMenu: Menu | null = null;
  private data_!: BattleData;
  private ended = false;

  constructor() {
    super('Battle');
  }

  init(data: BattleData): void {
    this.data_ = data;
    this.boxes = [];
    this.enemySprites = new Map();
    this.pendingKO = [];
    this.activeMenu = null;
    this.ended = false;
  }

  create(): void {
    const gs = session.gs;
    const ids = ENCOUNTER_GROUPS[this.data_.group];
    this.engine = new BattleEngine(
      gs.data.party.map((m) => ({ id: m.id, level: m.level, hp: m.hp, murk: m.murk, ...statsAt(m.id, m.level) })),
      ids,
    );
    this.controls = new Controls(this);
    createBattleBackground(this, ENEMIES[ids[0]].bg);
    this.cameras.main.fadeIn(250, 0, 0, 0);

    this.layoutEnemies();
    this.layoutParty();
    this.textbox = new TextBox(this, this.controls, { x: 8, y: 6, w: 304, lines: 3, autoAdvance: 650 });

    (window as unknown as { __SWAMP_BATTLE?: unknown }).__SWAMP_BATTLE = this;
    void this.run();
  }

  // ------------------------------------------------------------ layout

  private layoutEnemies(): void {
    const es = this.engine.enemies;
    const n = es.length;
    const xs = n === 1 ? [160] : n === 2 ? [100, 220] : [62, 160, 258];
    es.forEach((e, i) => {
      const art = BATTLERS[e.enemy!.art];
      const baseY = e.enemy!.boss ? 172 : 150;
      const s = this.add.sprite(xs[i], baseY, `battler_${e.enemy!.art}`, 0).setOrigin(0.5, 1);
      if (art.frames > 1) {
        this.time.addEvent({ delay: 420 + i * 40, loop: true, callback: () => s.active && s.setFrame((Number(s.frame.name) + 1) % art.frames) });
      }
      this.tweens.add({ targets: s, y: baseY - 3, yoyo: true, repeat: -1, duration: 900 + i * 120, ease: 'Sine.inOut' });
      this.enemySprites.set(e.key, s);
    });
  }

  private layoutParty(): void {
    const party = this.engine.party;
    const w = 72;
    const total = party.length * (w + 4) - 4;
    party.forEach((c, i) => {
      const x = 160 - total / 2 + i * (w + 4);
      const baseY = 190;
      const g = this.add.graphics();
      drawWindow(g, 0, 0, w, 46);
      const container = this.add.container(x, baseY, [g]).setDepth(900);
      const name = text(this, 6, 5, MEMBERS[c.memberId!].name.slice(0, 10), UI.accent);
      const hpl = text(this, 6, 16, 'HP', UI.dim);
      const mpl = text(this, 6, 27, 'MP', UI.dim);
      container.add([name, hpl, mpl]);
      const hp = new Odometer(this, container, 34, 16);
      const murk = new Odometer(this, container, 34, 27);
      const status = text(this, 6, 36, '', UI.danger);
      container.add(status);
      this.boxes.push({ c, container, g, hp, murk, status, baseY });
    });
    this.refreshBoxes();
  }

  private box(key: string): PartyBox | undefined {
    return this.boxes.find((b) => b.c.key === key);
  }

  private refreshBoxes(): void {
    for (const b of this.boxes) {
      b.hp.setValue(b.c.hp.current);
      b.murk.setValue(b.c.murk);
      const s = Object.keys(b.c.statuses)[0];
      b.status.setText(b.c.ko ? 'KO' : s ? STATUS_TAG[s] : '');
      const tint = b.c.ko ? hexToNum(UI.dim) : b.c.hp.current < b.c.hp.max * 0.25 ? hexToNum(UI.danger) : 0xffffff;
      b.hp.setTint(tint);
    }
  }

  private raise(key: string | null): void {
    for (const b of this.boxes) {
      const y = b.c.key === key ? b.baseY - 8 : b.baseY;
      this.tweens.add({ targets: b.container, y, duration: 100 });
    }
  }

  update(_t: number, dms: number): void {
    if (this.ended) return;
    const dt = Math.min(dms, 50) / 1000;
    const ko = this.engine.tick(dt);
    if (ko.length) {
      this.pendingKO.push(...ko);
      if (this.engine.outcome() === 'lose') this.activeMenu?.abort();
    }
    this.refreshBoxes();
  }

  // ------------------------------------------------------------ flow

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  private async run(): Promise<void> {
    const adv = this.data_.advantage;
    await this.wait(250);
    if (this.engine.isPushover()) {
      await this.msg(`Okee stares. The ${this.engine.enemies[0].enemy!.name} suddenly remembers somewhere else to be.`);
      this.engine.enemies.forEach((e) => (e.ko = true));
      this.enemySprites.forEach((s) => this.tweens.add({ targets: s, alpha: 0, duration: 400 }));
      await this.victory();
      return;
    }
    const intros = [...new Set(this.engine.enemies.map((e) => e.enemy!.intro))];
    for (const t of intros) await this.msg(t);
    if (adv === 'party') await this.msg('You got the jump on them!');
    if (adv === 'enemy') await this.msg('They got the jump on you!');

    let first = true;
    while (!this.engine.outcome()) {
      let cmds: Command[] = [];
      if (!(first && adv === 'enemy')) {
        const c = await this.collectCommands();
        if (!c) break;
        cmds = c;
      }
      this.raise(null);
      this.textbox.hide();
      this.engine.beginRound(cmds, first ? adv : 'none');
      first = false;
      for (;;) {
        await this.flushKOs();
        const ev = this.engine.next();
        if (!ev) break;
        await this.play(ev);
      }
      await this.flushKOs();
      if (this.engine.outcome()) break;
      await this.play(this.engine.endRound());
      await this.flushKOs();
    }
    await this.flushKOs();
    const o = this.engine.outcome();
    if (o === 'win') await this.victory();
    else if (o === 'fled') {
      this.writeBack();
      this.finish('fled');
    } else await this.defeat();
  }

  private async msg(s: string): Promise<void> {
    await this.textbox.say(s);
  }

  private async flushKOs(): Promise<void> {
    while (this.pendingKO.length) {
      const c = this.pendingKO.shift()!;
      sound.sfx('ko');
      const b = this.box(c.key);
      if (b) this.tweens.add({ targets: b.container, alpha: 0.6, duration: 300 });
      await this.msg(`${c.name} sank beneath the surface!`);
    }
  }

  // ------------------------------------------------------------ commands

  private async collectCommands(): Promise<Command[] | null> {
    const party = this.engine.party;
    const cmds: (Command | undefined)[] = [];
    const reserved: Record<string, number> = {};
    let i = 0;
    while (i < party.length) {
      if (this.engine.outcome()) return null;
      const m = party[i];
      if (m.ko) {
        i++;
        continue;
      }
      this.raise(m.key);
      const c = await this.chooseCommand(m, reserved, i > 0 && party.slice(0, i).some((p) => !p.ko));
      if (c === 'abort') return null;
      if (c === 'back') {
        do i--; while (i > 0 && party[i].ko);
        const prev = cmds[i];
        if (prev?.kind === 'item' && prev.item) reserved[prev.item]--;
        cmds[i] = undefined;
        continue;
      }
      if (c.kind === 'item' && c.item) reserved[c.item] = (reserved[c.item] ?? 0) + 1;
      cmds[i] = c;
      i++;
      if (c.kind === 'run') break;
    }
    return cmds.filter((c): c is Command => !!c);
  }

  private async openMenu(menu: Menu): Promise<number> {
    this.activeMenu = menu;
    const r = await menu.open();
    this.activeMenu = null;
    return r;
  }

  private async chooseCommand(m: Combatant, reserved: Record<string, number>, canBack: boolean): Promise<Command | 'back' | 'abort'> {
    const def = MEMBERS[m.memberId!];
    let start = 0;
    for (;;) {
      this.textbox.hide();
      const items = [{ label: def.attackName }, { label: def.skillMenu }, { label: 'Goods' }, { label: 'Guard' }, { label: 'Run', disabled: !this.engine.canFlee() }];
      const choice = await this.openMenu(
        new Menu(this, this.controls, items, { x: 8, y: 6, w: 304, columns: 3, colWidth: 96, title: `${m.name}  -  what will you do?`, start, cancelable: canBack }),
      );
      if (choice === ABORTED) return 'abort';
      if (choice === CANCELLED) return 'back';
      start = choice;
      if (choice === 0) {
        const t = await this.pickEnemy();
        if (t) return { actor: m.key, kind: 'attack', target: t };
      } else if (choice === 1) {
        const c = await this.chooseSkill(m);
        if (c === 'abort') return 'abort';
        if (c) return c;
      } else if (choice === 2) {
        const c = await this.chooseItem(m, reserved);
        if (c === 'abort') return 'abort';
        if (c) return c;
      } else if (choice === 3) return { actor: m.key, kind: 'guard' };
      else if (choice === 4) return { actor: m.key, kind: 'run' };
    }
  }

  private async chooseSkill(m: Combatant): Promise<Command | null | 'abort'> {
    const skills = skillsAt(m.memberId!, m.level).map((id) => SKILLS[id]);
    const i = await this.openMenu(
      new Menu(this, this.controls, skills.map((s) => ({ label: s.name, right: `${s.cost}`, disabled: s.cost > m.murk })), {
        x: 8, y: 52, w: 180, title: `${MEMBERS[m.memberId!].skillMenu}  (Murk ${m.murk})`,
        onMove: (k) => this.textbox.set(skills[k].desc), depth: 1600,
      }),
    );
    this.textbox.hide();
    if (i === ABORTED) return 'abort';
    if (i === CANCELLED) return null;
    const sk = skills[i];
    let target: string | undefined;
    if (sk.target === 'enemy') {
      const t = await this.pickEnemy();
      if (!t) return null;
      target = t;
    } else if (sk.target === 'ally') {
      const t = await this.pickAlly(sk.revive);
      if (!t) return null;
      target = t;
    }
    return { actor: m.key, kind: 'skill', skill: sk.id, target };
  }

  private async chooseItem(m: Combatant, reserved: Record<string, number>): Promise<Command | null | 'abort'> {
    const list = session.gs
      .itemList()
      .map((it) => ({ ...it, count: it.count - (reserved[it.id] ?? 0) }))
      .filter((it) => it.count > 0);
    if (!list.length) {
      await this.msg('Nothing in your pockets but pond water.');
      return null;
    }
    const i = await this.openMenu(
      new Menu(this, this.controls, list.map((it) => ({ label: ITEMS[it.id].name, right: `x${it.count}`, disabled: !ITEMS[it.id].battle })), {
        x: 8, y: 52, w: 200, maxRows: 6, title: 'Goods', onMove: (k) => this.textbox.set(ITEMS[list[k].id].desc), depth: 1600,
      }),
    );
    this.textbox.hide();
    if (i === ABORTED) return 'abort';
    if (i === CANCELLED) return null;
    const it = ITEMS[list[i].id];
    let target: string | undefined;
    if (it.target === 'enemy') {
      const t = await this.pickEnemy();
      if (!t) return null;
      target = t;
    } else if (it.target === 'ally') {
      const t = await this.pickAlly(it.revive);
      if (!t) return null;
      target = t;
    }
    return { actor: m.key, kind: 'item', item: it.id, target };
  }

  private pickFrom<T extends { key: string }>(list: T[], pos: (t: T) => { x: number; y: number }, label: (t: T) => string): Promise<string | null> {
    if (list.length === 1 && list[0].key.startsWith('e')) return Promise.resolve(list[0].key);
    return new Promise((resolve) => {
      let i = 0;
      const arrow = text(this, 0, 0, '▼', UI.accent).setDepth(2000);
      this.tweens.add({ targets: arrow, alpha: 0.3, yoyo: true, repeat: -1, duration: 250 });
      const place = () => {
        const p = pos(list[i]);
        arrow.setPosition(p.x - 2, p.y);
        this.textbox.set(label(list[i]));
      };
      place();
      const h: Handler = (a) => {
        if (a === 'left' || a === 'up') i = (i + list.length - 1) % list.length;
        else if (a === 'right' || a === 'down') i = (i + 1) % list.length;
        else if (a === 'confirm' || a === 'cancel') {
          this.controls.pop(h);
          arrow.destroy();
          this.textbox.hide();
          sound.sfx(a === 'confirm' ? 'confirm' : 'cancel');
          resolve(a === 'confirm' ? list[i].key : null);
          return;
        }
        sound.sfx('move');
        place();
      };
      this.controls.push(h);
    });
  }

  private pickEnemy(): Promise<string | null> {
    return this.pickFrom(
      this.engine.livingEnemies(),
      (e) => {
        const s = this.enemySprites.get(e.key)!;
        return { x: s.x, y: s.y - s.height - 10 };
      },
      (e) => `Target: ${e.name}`,
    );
  }

  private pickAlly(allowKo = false): Promise<string | null> {
    const list = this.engine.party.filter((p) => allowKo || !p.ko);
    if (list.length === 1) return Promise.resolve(list[0].key);
    return this.pickFrom(
      list,
      (p) => {
        const b = this.box(p.key)!;
        return { x: b.container.x + 34, y: b.baseY - 18 };
      },
      (p) => `On: ${p.name}`,
    );
  }

  // ------------------------------------------------------------ presentation

  private async play(events: BattleEvent[]): Promise<void> {
    let i = 0;
    while (i < events.length) {
      const ev = events[i];
      if (ev.t === 'msg') {
        // Fire the effects that belong to this message alongside it.
        let j = i + 1;
        const effects: BattleEvent[] = [];
        while (j < events.length && events[j].t !== 'msg') effects.push(events[j++]);
        const fx = Promise.all(effects.map((e) => this.effect(e)));
        await this.msg(ev.text);
        await fx;
        i = j;
      } else {
        await this.effect(ev);
        i++;
      }
      await this.flushKOs();
      if (this.engine.outcome() === 'lose') return;
    }
  }

  private popup(x: number, y: number, s: string, color: string): void {
    const t = text(this, x, y, s, color).setOrigin(0.5).setDepth(1800);
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => t.destroy() });
  }

  private async effect(ev: BattleEvent): Promise<void> {
    switch (ev.t) {
      case 'attackAnim': {
        const s = this.enemySprites.get(ev.actor);
        if (s) {
          sound.sfx('enemyAttack');
          this.tweens.add({ targets: s, scale: 1.12, duration: 110, yoyo: true });
          await this.wait(150);
        } else if (ev.target) {
          const t = this.enemySprites.get(ev.target);
          if (t) {
            const slash = this.add.graphics().setDepth(1700);
            slash.lineStyle(2, 0xffffff, 1).lineBetween(t.x - 20, t.y - t.height + 6, t.x + 20, t.y - 10);
            this.tweens.add({ targets: slash, alpha: 0, duration: 220, onComplete: () => slash.destroy() });
          }
          await this.wait(120);
        }
        break;
      }
      case 'damage': {
        const s = this.enemySprites.get(ev.target);
        if (s) {
          sound.sfx(ev.crit ? 'crit' : 'hit');
          this.popup(s.x, s.y - s.height / 2, `${ev.amount}`, ev.crit ? UI.accent : UI.text);
          const x = s.x;
          this.tweens.add({ targets: s, x: x + 4, duration: 40, yoyo: true, repeat: 2, onComplete: () => s.setX(x) });
          this.tweens.add({ targets: s, alpha: 0.2, duration: 60, yoyo: true, repeat: 2 });
          if (ev.crit) this.cameras.main.flash(120, 255, 255, 255);
        } else {
          sound.sfx('hurt');
          this.cameras.main.shake(220, ev.crit ? 0.02 : 0.01);
          const b = this.box(ev.target);
          if (b) {
            this.popup(b.container.x + 36, b.baseY - 6, `-${ev.amount}`, UI.danger);
            b.g.clear();
            drawWindow(b.g, 0, 0, 72, 46, UI.danger);
            this.time.delayedCall(260, () => {
              b.g.clear();
              drawWindow(b.g, 0, 0, 72, 46);
            });
          }
        }
        await this.wait(120);
        break;
      }
      case 'heal': {
        const s = this.enemySprites.get(ev.target);
        if (s) this.popup(s.x, s.y - s.height / 2, `+${ev.amount}`, '#b6d84b');
        else {
          const b = this.box(ev.target);
          if (b) this.popup(b.container.x + 36, b.baseY - 6, `+${ev.amount}`, '#b6d84b');
        }
        sound.sfx('heal');
        break;
      }
      case 'murk':
        if (ev.amount < 0) sound.sfx('murk');
        break;
      case 'miss':
        sound.sfx('miss');
        break;
      case 'ko': {
        const s = this.enemySprites.get(ev.target);
        if (s) {
          sound.sfx('ko');
          this.tweens.killTweensOf(s);
          s.setTint(0xf07aa8);
          await new Promise<void>((r) =>
            this.tweens.add({ targets: s, alpha: 0, scaleY: 0.1, scaleX: 1.3, duration: 450, ease: 'Quad.in', onComplete: () => r() }),
          );
          s.setVisible(false);
        }
        break;
      }
      case 'revive': {
        const b = this.box(ev.target);
        if (b) b.container.setAlpha(1);
        sound.sfx('heal');
        break;
      }
      case 'consume':
        session.gs.removeItem(ev.item);
        break;
      case 'status':
        sound.sfx('miss');
        break;
      case 'flee':
        if (ev.success) sound.sfx('cancel');
        break;
      case 'msg':
        break;
    }
  }

  // ------------------------------------------------------------ endings

  private writeBack(): void {
    const gs = session.gs;
    for (const c of this.engine.party) {
      const m = gs.member(c.memberId!);
      if (!m) continue;
      m.hp = c.ko ? 0 : c.hp.value;
      m.murk = c.murk;
    }
  }

  private async victory(): Promise<void> {
    this.engine.freezeMeters();
    this.refreshBoxes();
    this.writeBack();
    sound.stopMusic();
    sound.sfx('win');
    await this.msg('YOU WON!');
    const gs = session.gs;
    const r = this.engine.rewards();
    const conscious = this.engine.party.filter((p) => !p.ko).map((p) => p.memberId!);
    gs.data.money += r.money;
    const names = conscious.map((id) => MEMBERS[id].name).join(' and ');
    await this.msg(`${names} gained ${r.xp} experience. Found $${r.money}.`);
    for (const d of r.drops) {
      gs.addItem(d);
      sound.sfx('item');
      await this.msg(`Something was left behind: ${ITEMS[d].name}!`);
    }
    const ups = gs.gainXp(r.xp, conscious);
    for (const u of ups) {
      if (u.includes('reached level')) sound.sfx('levelup');
      await this.msg(u);
    }
    for (const c of this.engine.party) {
      const m = gs.member(c.memberId!)!;
      if (m.hp <= 0) {
        m.hp = 1;
        await this.msg(`${c.name} crawls out of the water, dripping. (1 HP)`);
      }
    }
    this.finish('win');
  }

  private async defeat(): Promise<void> {
    this.ended = true;
    sound.stopMusic();
    await this.msg('The party was dragged under...');
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('Overworld');
      this.scene.start('GameOver');
    });
  }

  private finish(o: Outcome): void {
    this.ended = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const cb = this.data_.onEnd;
      this.scene.stop();
      this.scene.resume('Overworld');
      cb(o);
    });
  }
}
