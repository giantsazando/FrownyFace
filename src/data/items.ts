export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  battle: boolean;
  field: boolean;
  target: 'ally' | 'enemy' | 'allEnemies';
  heal?: number;
  murk?: number;
  cure?: boolean;
  revive?: boolean;
  damage?: number;
  text: string;
}

export const ITEMS: Record<string, ItemDef> = {
  peanuts: {
    id: 'peanuts', name: 'Boiled Peanuts', desc: 'Wet. Salty. Heals 35 HP.', price: 8,
    battle: true, field: true, target: 'ally', heal: 35, text: '{user} shares some Boiled Peanuts with {target}.',
  },
  coffee: {
    id: 'coffee', name: 'Cafecito', desc: 'Restores 12 Murk.', price: 14,
    battle: true, field: true, target: 'ally', murk: 12, text: '{target} downs a Cafecito. Their pupils dilate.',
  },
  sunscreen: {
    id: 'sunscreen', name: 'SPF 100', desc: 'Cures burns and venom. Heals 15 HP.', price: 6,
    battle: true, field: true, target: 'ally', heal: 15, cure: true, text: '{user} slathers {target} in SPF 100.',
  },
  keylime: {
    id: 'keylime', name: 'Key Lime Pie', desc: 'A whole slice. Heals 100 HP.', price: 40,
    battle: true, field: true, target: 'ally', heal: 100, text: '{target} eats a slice of Key Lime Pie. It tastes like 1994.',
  },
  gatorade: {
    id: 'gatorade', name: 'Swamp Water', desc: 'Revives a fallen ally.', price: 60,
    battle: true, field: true, target: 'ally', revive: true, heal: 30, text: '{user} pours Swamp Water over {target}.',
  },
  rocket: {
    id: 'rocket', name: 'Bottle Rocket', desc: 'Deals 45 damage.', price: 18,
    battle: true, field: false, target: 'enemy', damage: 45, text: '{user} lights a Bottle Rocket at {target}!',
  },
  sparkler: {
    id: 'sparkler', name: 'Fireworks Crate', desc: '30 damage to all enemies.', price: 45,
    battle: true, field: false, target: 'allEnemies', damage: 30, text: '{user} kicks over a crate of roadside fireworks!',
  },
};

export const SHOPS: Record<string, { name: string; items: string[] }> = {
  baitvape: { name: 'BAIT & VAPE', items: ['peanuts', 'coffee', 'sunscreen', 'rocket', 'gatorade'] },
  vending: { name: 'VENDING MACHINE', items: ['peanuts', 'coffee', 'keylime', 'sparkler'] },
};
