import { ENEMIES, type EnemyDef, type EnemyMove } from '../../data/enemies';
import { ITEMS } from '../../data/items';
import { MEMBERS, type MemberId } from '../../data/party';
import { SKILLS, type StatusId } from '../../data/skills';
import { RollingMeter } from './RollingMeter';

export type Side = 'party' | 'enemy';

export interface Combatant {
  key: string;
  side: Side;
  name: string;
  level: number;
  off: number;
  def: number;
  spd: number;
  hp: RollingMeter;
  murk: number;
  maxMurk: number;
  statuses: Partial<Record<StatusId, number>>;
  guarding: boolean;
  ko: boolean;
  memberId?: MemberId;
  enemy?: EnemyDef;
  enraged?: boolean;
}

export interface PartyInput {
  id: MemberId;
  level: number;
  hp: number;
  murk: number;
  maxHp: number;
  maxMurk: number;
  off: number;
  def: number;
  spd: number;
}

export type CommandKind = 'attack' | 'skill' | 'item' | 'guard' | 'run';
export interface Command {
  actor: string;
  kind: CommandKind;
  skill?: string;
  item?: string;
  target?: string;
}

export type BattleEvent =
  | { t: 'msg'; text: string }
  | { t: 'damage'; target: string; amount: number; crit: boolean }
  | { t: 'heal'; target: string; amount: number }
  | { t: 'murk'; target: string; amount: number }
  | { t: 'miss'; target: string }
  | { t: 'ko'; target: string }
  | { t: 'revive'; target: string }
  | { t: 'status'; target: string; status: StatusId }
  | { t: 'consume'; item: string }
  | { t: 'flee'; success: boolean }
  | { t: 'attackAnim'; actor: string; target?: string };

export type Outcome = 'win' | 'lose' | 'fled' | null;
export type Advantage = 'party' | 'enemy' | 'none';

const STATUS_NAMES: Record<StatusId, string> = {
  sunburn: 'burning',
  venom: 'poisoned',
  weak: 'weakened',
  guarded: 'cold-blooded',
  slow: 'slowed',
};

function fmt(text: string, user: Combatant, target?: Combatant): string {
  return text.replace(/\{user\}/g, user.name).replace(/\{target\}/g, target?.name ?? 'everyone');
}

export class BattleEngine {
  party: Combatant[];
  enemies: Combatant[];
  round = 0;
  private queue: { actor: Combatant; cmd?: Command }[] = [];
  private fled = false;

  constructor(
    party: PartyInput[],
    enemyIds: string[],
    private rng: () => number = Math.random,
  ) {
    this.party = party.map((p) => ({
      key: p.id,
      side: 'party',
      name: MEMBERS[p.id].name,
      level: p.level,
      off: p.off,
      def: p.def,
      spd: p.spd,
      hp: new RollingMeter(p.hp, p.maxHp),
      murk: p.murk,
      maxMurk: p.maxMurk,
      statuses: {},
      guarding: false,
      ko: p.hp <= 0,
      memberId: p.id,
    }));
    const counts: Record<string, number> = {};
    const totals: Record<string, number> = {};
    enemyIds.forEach((id) => (totals[id] = (totals[id] ?? 0) + 1));
    this.enemies = enemyIds.map((id, i) => {
      const def = ENEMIES[id];
      counts[id] = (counts[id] ?? 0) + 1;
      const suffix = totals[id] > 1 ? ' ' + String.fromCharCode(64 + counts[id]) : '';
      const hp = new RollingMeter(def.hp, def.hp, 1e6, 1e6);
      return {
        key: `e${i}`,
        side: 'enemy',
        name: def.name + suffix,
        level: def.level,
        off: def.off,
        def: def.def,
        spd: def.spd,
        hp,
        murk: 0,
        maxMurk: 0,
        statuses: {},
        guarding: false,
        ko: false,
        enemy: def,
      };
    });
  }

  get all(): Combatant[] {
    return [...this.party, ...this.enemies];
  }

  get(key: string): Combatant | undefined {
    return this.all.find((c) => c.key === key);
  }

  livingParty(): Combatant[] {
    return this.party.filter((c) => !c.ko);
  }

  livingEnemies(): Combatant[] {
    return this.enemies.filter((c) => !c.ko);
  }

  outcome(): Outcome {
    if (this.fled) return 'fled';
    if (this.livingEnemies().length === 0) return 'win';
    if (this.livingParty().length === 0) return 'lose';
    return null;
  }

  canFlee(): boolean {
    return !this.enemies.some((e) => e.enemy?.boss);
  }

  /** Party is overwhelmingly stronger: EB-style instant win. */
  isPushover(): boolean {
    const lvl = Math.max(...this.party.map((p) => p.level));
    return this.enemies.every((e) => !e.enemy?.boss && e.level + 5 <= lvl);
  }

  /** Advance rolling meters. Returns party members newly knocked out. */
  tick(dt: number): Combatant[] {
    const newlyKo: Combatant[] = [];
    for (const p of this.party) {
      p.hp.update(dt);
      if (!p.ko && p.hp.empty) {
        p.ko = true;
        p.statuses = {};
        newlyKo.push(p);
      }
    }
    return newlyKo;
  }

  /** Called on victory so mortal damage still rolling is forgiven. */
  freezeMeters(): void {
    for (const p of this.party) if (!p.ko) p.hp.freeze();
  }

  effSpd(c: Combatant): number {
    return c.spd * (c.statuses.slow ? 0.5 : 1);
  }

  beginRound(commands: Command[], advantage: Advantage = 'none'): void {
    this.round++;
    const entries: { actor: Combatant; cmd?: Command; roll: number }[] = [];
    if (advantage !== 'enemy') {
      for (const cmd of commands) {
        const actor = this.get(cmd.actor);
        if (!actor || actor.ko) continue;
        if (cmd.kind === 'guard') actor.guarding = true;
        entries.push({ actor, cmd, roll: this.effSpd(actor) * (0.75 + this.rng() * 0.5) + (cmd.kind === 'guard' ? 999 : 0) });
      }
    }
    if (advantage !== 'party') {
      for (const e of this.livingEnemies()) entries.push({ actor: e, roll: this.effSpd(e) * (0.75 + this.rng() * 0.5) });
    }
    entries.sort((a, b) => b.roll - a.roll);
    this.queue = entries.map(({ actor, cmd }) => ({ actor, cmd }));
  }

  /** Execute the next queued action. Returns null when the round is over. */
  next(): BattleEvent[] | null {
    while (this.queue.length) {
      if (this.outcome()) return null;
      const { actor, cmd } = this.queue.shift()!;
      if (actor.ko) continue;
      return actor.side === 'party' && cmd ? this.partyAct(actor, cmd) : this.enemyAct(actor);
    }
    return null;
  }

  endRound(): BattleEvent[] {
    const ev: BattleEvent[] = [];
    for (const c of this.all) {
      c.guarding = false;
      if (c.ko) continue;
      if (c.statuses.sunburn) {
        const dmg = Math.max(2, Math.round(3 + c.hp.max * 0.05));
        ev.push({ t: 'msg', text: `${c.name} is burning! ${dmg} damage.` });
        this.applyDamage(c, dmg, ev, false);
      }
      if (c.statuses.venom && !c.ko) {
        const dmg = Math.max(3, Math.round(4 + c.hp.max * 0.07));
        ev.push({ t: 'msg', text: `Venom burns in ${c.name}'s veins! ${dmg} damage.` });
        this.applyDamage(c, dmg, ev, false);
      }
      for (const s of Object.keys(c.statuses) as StatusId[]) {
        c.statuses[s]! -= 1;
        if (c.statuses[s]! <= 0) {
          delete c.statuses[s];
          if (!c.ko) ev.push({ t: 'msg', text: `${c.name} is no longer ${STATUS_NAMES[s]}.` });
        }
      }
    }
    return ev;
  }

  // --- damage ---------------------------------------------------------------

  calcDamage(att: Combatant, tgt: Combatant, power = 1, ignoreDef = false, canCrit = true) {
    if (this.rng() < 1 / 18) return { amount: 0, crit: false, miss: true };
    const off = att.off * (att.statuses.weak ? 0.6 : 1) * (att.enraged ? 1.2 : 1);
    const def = tgt.def * (tgt.statuses.guarded ? 1.6 : 1);
    const crit = canCrit && this.rng() < (att.side === 'party' ? 1 / 16 : 1 / 30);
    let base = crit || ignoreDef ? 2 * off * (crit ? 1.5 : 1) : 2 * off - def;
    base = Math.max(1, base) * power * (0.8 + this.rng() * 0.4);
    if (tgt.guarding) base *= 0.5;
    return { amount: Math.max(1, Math.round(base)), crit, miss: false };
  }

  private applyDamage(tgt: Combatant, amount: number, ev: BattleEvent[], crit: boolean): void {
    tgt.hp.damage(amount);
    ev.push({ t: 'damage', target: tgt.key, amount, crit });
    if (tgt.side === 'enemy') {
      tgt.hp.update(1); // enemies don't roll
      if (tgt.hp.empty && !tgt.ko) {
        tgt.ko = true;
        ev.push({ t: 'ko', target: tgt.key });
        ev.push({ t: 'msg', text: tgt.enemy!.defeat });
      } else if (tgt.enemy?.boss && !tgt.enraged && tgt.hp.target < tgt.hp.max * 0.5) {
        tgt.enraged = true;
        ev.push({ t: 'msg', text: `${tgt.name} remembers being loved. It is furious.` });
      }
    }
  }

  private heal(tgt: Combatant, amount: number, ev: BattleEvent[]): void {
    const before = tgt.hp.target;
    tgt.hp.heal(amount);
    ev.push({ t: 'heal', target: tgt.key, amount: Math.round(tgt.hp.target - before) });
  }

  /** Returns true if the attack connected. */
  private attack(att: Combatant, tgt: Combatant, power: number, ev: BattleEvent[], ignoreDef = false, canCrit = true): boolean {
    ev.push({ t: 'attackAnim', actor: att.key, target: tgt.key });
    const r = this.calcDamage(att, tgt, power, ignoreDef, canCrit);
    if (r.miss) {
      ev.push({ t: 'miss', target: tgt.key });
      ev.push({ t: 'msg', text: `It missed ${tgt.name}!` });
      return false;
    }
    if (r.crit) ev.push({ t: 'msg', text: att.side === 'party' ? 'SMAAAASH!!' : 'A devastating blow!' });
    ev.push({ t: 'msg', text: `${r.amount} damage to ${tgt.name}!` });
    this.applyDamage(tgt, r.amount, ev, r.crit);
    return true;
  }

  private cure(t: Combatant, ev: BattleEvent[]): void {
    if (t.statuses.sunburn) {
      delete t.statuses.sunburn;
      ev.push({ t: 'msg', text: `${t.name} stops burning.` });
    }
    if (t.statuses.venom) {
      delete t.statuses.venom;
      ev.push({ t: 'msg', text: `The venom leaves ${t.name}.` });
    }
  }

  private retarget(key: string | undefined, side: Side): Combatant | undefined {
    const pool = side === 'enemy' ? this.livingEnemies() : this.livingParty();
    const t = key ? this.get(key) : undefined;
    if (t && !t.ko) return t;
    return pool[0];
  }

  private partyAct(actor: Combatant, cmd: Command): BattleEvent[] {
    const ev: BattleEvent[] = [];
    switch (cmd.kind) {
      case 'guard':
        ev.push({ t: 'msg', text: `${actor.name} braces in the mud.` });
        break;
      case 'attack': {
        const tgt = this.retarget(cmd.target, 'enemy');
        if (!tgt) break;
        const verb = actor.memberId === 'ibis' ? 'pecks at' : 'chomps';
        ev.push({ t: 'msg', text: `${actor.name} ${verb} ${tgt.name}!` });
        this.attack(actor, tgt, 1, ev);
        break;
      }
      case 'run': {
        const ok = this.canFlee() && this.rng() < this.fleeChance();
        ev.push({ t: 'msg', text: `${actor.name} tries to slip back into the water...` });
        ev.push({ t: 'flee', success: ok });
        if (ok) {
          this.fled = true;
          ev.push({ t: 'msg', text: 'Got away!' });
        } else ev.push({ t: 'msg', text: this.canFlee() ? "Couldn't get away!" : 'There is nowhere to go. The store is everywhere.' });
        break;
      }
      case 'skill':
        this.useSkill(actor, cmd, ev);
        break;
      case 'item':
        this.useItem(actor, cmd, ev);
        break;
    }
    return ev;
  }

  fleeChance(): number {
    const ps = Math.max(...this.livingParty().map((p) => this.effSpd(p)));
    const es = Math.max(...this.livingEnemies().map((e) => this.effSpd(e)));
    return Math.min(0.95, Math.max(0.15, 0.55 + (ps - es) * 0.05 + this.round * 0.08));
  }

  private targetsFor(kind: string, actor: Combatant, key?: string): Combatant[] {
    switch (kind) {
      case 'enemy': {
        const t = this.retarget(key, 'enemy');
        return t ? [t] : [];
      }
      case 'allEnemies':
        return this.livingEnemies();
      case 'ally': {
        const t = key ? this.get(key) : undefined;
        return t ? [t] : [actor];
      }
      case 'allAllies':
        return this.party;
      default:
        return [actor];
    }
  }

  private useSkill(actor: Combatant, cmd: Command, ev: BattleEvent[]): void {
    const sk = SKILLS[cmd.skill!];
    if (actor.murk < sk.cost) {
      ev.push({ t: 'msg', text: `${actor.name} reaches for ${sk.name}, but there isn't enough Murk.` });
      return;
    }
    actor.murk -= sk.cost;
    ev.push({ t: 'murk', target: actor.key, amount: -sk.cost });
    const targets = this.targetsFor(sk.target, actor, cmd.target);
    ev.push({ t: 'msg', text: fmt(sk.text, actor, targets.length === 1 ? targets[0] : undefined) });
    for (const t of targets) {
      if (sk.power) this.attack(actor, t, sk.power, ev, !!sk.ignoreDef, false);
      if (sk.revive && t.ko) {
        t.ko = false;
        t.hp.set(1);
        ev.push({ t: 'revive', target: t.key });
        ev.push({ t: 'msg', text: `${t.name} comes back up for air!` });
      }
      if (t.ko) continue;
      if (sk.heal || sk.healFlat) {
        const amt = Math.round((sk.heal ?? 0) * t.hp.max + (sk.healFlat ?? 0));
        this.heal(t, amt, ev);
        ev.push({ t: 'msg', text: `${t.name} recovers ${amt} HP.` });
      }
      if (sk.cure) this.cure(t, ev);
      if (sk.status) this.inflict(t, sk.status.id, sk.status.turns, ev);
    }
  }

  private inflict(t: Combatant, s: StatusId, turns: number, ev: BattleEvent[]): void {
    if (t.ko) return;
    t.statuses[s] = Math.max(t.statuses[s] ?? 0, turns);
    ev.push({ t: 'status', target: t.key, status: s });
    ev.push({ t: 'msg', text: `${t.name} is ${STATUS_NAMES[s]}!` });
  }

  private useItem(actor: Combatant, cmd: Command, ev: BattleEvent[]): void {
    const it = ITEMS[cmd.item!];
    const targets = this.targetsFor(it.target, actor, cmd.target);
    ev.push({ t: 'consume', item: it.id });
    ev.push({ t: 'msg', text: fmt(it.text, actor, targets.length === 1 ? targets[0] : undefined) });
    for (const t of targets) {
      if (it.damage) {
        ev.push({ t: 'attackAnim', actor: actor.key, target: t.key });
        const amt = Math.round(it.damage * (0.9 + this.rng() * 0.2));
        ev.push({ t: 'msg', text: `${amt} damage to ${t.name}!` });
        this.applyDamage(t, amt, ev, false);
        continue;
      }
      if (it.revive) {
        if (!t.ko) {
          ev.push({ t: 'msg', text: `${t.name} was already awake. It feels refreshing anyway.` });
        } else {
          t.ko = false;
          t.hp.set(0.01);
          ev.push({ t: 'revive', target: t.key });
          ev.push({ t: 'msg', text: `${t.name} comes back up for air!` });
        }
      } else if (t.ko) {
        ev.push({ t: 'msg', text: `It had no effect on ${t.name}...` });
        continue;
      }
      if (it.heal) {
        this.heal(t, it.heal, ev);
        ev.push({ t: 'msg', text: `${t.name} recovers ${it.heal} HP.` });
      }
      if (it.murk) {
        const before = t.murk;
        t.murk = Math.min(t.maxMurk, t.murk + it.murk);
        ev.push({ t: 'murk', target: t.key, amount: t.murk - before });
        ev.push({ t: 'msg', text: `${t.name} recovers ${t.murk - before} Murk.` });
      }
      if (it.cure) this.cure(t, ev);
    }
  }

  pickEnemyMove(e: Combatant): EnemyMove {
    let moves = e.enemy!.moves;
    if (e.hp.target >= e.hp.max * 0.6) moves = moves.filter((m) => m.kind !== 'heal');
    const total = moves.reduce((s, m) => s + m.weight, 0);
    let r = this.rng() * total;
    for (const m of moves) {
      r -= m.weight;
      if (r <= 0) return m;
    }
    return moves[moves.length - 1];
  }

  private enemyAct(e: Combatant): BattleEvent[] {
    const ev: BattleEvent[] = [];
    const living = this.livingParty();
    if (!living.length) return ev;
    const move = this.pickEnemyMove(e);
    const target = living[Math.floor(this.rng() * living.length)];
    switch (move.kind) {
      case 'nothing':
        ev.push({ t: 'msg', text: fmt(move.text, e, target) });
        break;
      case 'attack':
        ev.push({ t: 'msg', text: fmt(move.text, e, target) });
        if (this.attack(e, target, move.power ?? 1, ev) && move.status) this.inflict(target, move.status.id, move.status.turns, ev);
        break;
      case 'attackAll':
        ev.push({ t: 'msg', text: fmt(move.text, e) });
        for (const t of living) if (this.attack(e, t, move.power ?? 1, ev) && move.status) this.inflict(t, move.status.id, move.status.turns, ev);
        break;
      case 'status':
        ev.push({ t: 'msg', text: fmt(move.text, e, target) });
        ev.push({ t: 'attackAnim', actor: e.key, target: target.key });
        if (move.status) {
          target.statuses[move.status.id] = Math.max(target.statuses[move.status.id] ?? 0, move.status.turns);
          ev.push({ t: 'status', target: target.key, status: move.status.id });
        }
        break;
      case 'statusAll':
        ev.push({ t: 'msg', text: fmt(move.text, e) });
        for (const t of living) if (move.status) this.inflict(t, move.status.id, move.status.turns, ev);
        break;
      case 'heal': {
        ev.push({ t: 'msg', text: fmt(move.text, e, target) });
        const before = e.hp.target;
        e.hp.heal(move.heal ?? 10);
        e.hp.update(1);
        ev.push({ t: 'heal', target: e.key, amount: Math.round(e.hp.target - before) });
        break;
      }
    }
    return ev;
  }

  rewards(): { xp: number; money: number; drops: string[] } {
    let xp = 0;
    let money = 0;
    const drops: string[] = [];
    for (const e of this.enemies) {
      xp += e.enemy!.xp;
      money += e.enemy!.money;
      const d = e.enemy!.drop;
      if (d && this.rng() < d.chance) drops.push(d.item);
    }
    return { xp, money, drops };
  }
}
