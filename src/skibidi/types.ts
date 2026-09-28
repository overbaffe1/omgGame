export type SkibidiCategory = 'toilet' | 'astro' | 'mutant' | 'titan' | 'zombie' | 'meme';

export interface SkibidiType {
  id: string;
  name: string;
  nameRu: string;
  emoji: string;
  category: SkibidiCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  color: string;
  accent: string;
  description: string;
  power: number;
  hasJetpack?: boolean;
  hasLegs?: boolean;
  hasArms?: boolean;
  hasBuzzsaw?: boolean;
  isAstro?: boolean;
  stripes?: number;
  isTitan?: boolean;
  isZombie?: boolean;
}

export const SKIBIDI_TYPES: SkibidiType[] = [
  // Classic toilets
  { id: 'normal', name: 'Normal Skibidi', nameRu: 'Обычный Скибиди', emoji: '🚽', category: 'toilet', rarity: 'common', color: '#ffffff', accent: '#a0a0a0', description: 'Brr skibidi dop dop dop yes yes', power: 10 },
  { id: 'small', name: 'Small Skibidi', nameRu: 'Маленький Скибиди', emoji: '🚽', category: 'toilet', rarity: 'common', color: '#f0f0f0', accent: '#888', description: 'Tiny but annoying', power: 5 },
  { id: 'large', name: 'Large Skibidi', nameRu: 'Большой Скибиди', emoji: '🚽', category: 'toilet', rarity: 'common', color: '#e0e0e0', accent: '#666', description: 'CHONKY', power: 25 },
  { id: 'jetpack', name: 'Jetpack Skibidi', nameRu: 'Джетпак Скибиди', emoji: '🚀', category: 'toilet', rarity: 'rare', color: '#d0e0ff', accent: '#3b82f6', description: 'Flying toilet menace', power: 40, hasJetpack: true },
  { id: 'spider', name: 'Spider Skibidi', nameRu: 'Паук Скибиди', emoji: '🕷️', category: 'toilet', rarity: 'rare', color: '#2a2a2a', accent: '#ef4444', description: 'Strider legs from HL2', power: 45, hasLegs: true },
  { id: 'acid', name: 'Acid Skibidi', nameRu: 'Кислотный Скибиди', emoji: '🧪', category: 'toilet', rarity: 'epic', color: '#a3e635', accent: '#22c55e', description: 'Melts cameramen', power: 60 },
  { id: 'laser', name: 'Laser Skibidi', nameRu: 'Лазерный Скибиди', emoji: '🔫', category: 'toilet', rarity: 'epic', color: '#ff4444', accent: '#dc2626', description: 'PEW PEW', power: 70 },

  // Mutants
  { id: 'mutant-normal', name: 'Mutant Skibidi', nameRu: 'Мутант Скибиди', emoji: '🧟', category: 'mutant', rarity: 'rare', color: '#fbbf24', accent: '#d97706', description: 'Grew arms and legs', power: 55, hasArms: true, hasLegs: true },
  { id: 'buzzsaw', name: 'Buzzsaw Mutant', nameRu: 'Бензопила Мутант', emoji: '🪚', category: 'mutant', rarity: 'epic', color: '#444', accent: '#f59e0b', description: 'BZZZZT SAWS EVERYTHING', power: 85, hasArms: true, hasBuzzsaw: true },
  { id: 'berserker', name: 'Berserker Mutant', nameRu: 'Берсерк Мутант', emoji: '😡', category: 'mutant', rarity: 'legendary', color: '#7f1d1d', accent: '#ef4444', description: 'RAGE MODE', power: 95, hasArms: true, hasLegs: true },

  // Astro (trending 2025-2026)
  { id: 'astro-trooper', name: 'Astro Trooper', nameRu: 'Астро Штурмовик', emoji: '👨‍🚀', category: 'astro', rarity: 'rare', color: '#1e1b4b', accent: '#6366f1', description: 'Basic astro grunt', power: 50, isAstro: true, stripes: 0 },
  { id: 'astro-specialist', name: 'Astro Specialist', nameRu: 'Астро Спец', emoji: '🛸', category: 'astro', rarity: 'epic', color: '#312e81', accent: '#818cf8', description: 'Spy + fighter', power: 70, isAstro: true, stripes: 1 },
  { id: 'astro-strider', name: 'Astro Strider', nameRu: 'Астро Страйдер', emoji: '🦿', category: 'astro', rarity: 'epic', color: '#1e293b', accent: '#38bdf8', description: 'Tank legs', power: 75, isAstro: true, hasLegs: true, stripes: 0 },
  { id: 'astro-destructor', name: 'Destructor Astro', nameRu: 'Деструктор Астро', emoji: '💥', category: 'astro', rarity: 'legendary', color: '#0f172a', accent: '#f472b6', description: 'Semi-Titan destroyer', power: 110, isAstro: true, stripes: 2 },
  { id: 'astro-annihilator', name: 'Annihilator Astro', nameRu: 'Аннигилятор Астро', emoji: '☄️', category: 'astro', rarity: 'legendary', color: '#020617', accent: '#e879f9', description: 'Bombardier + Annihilator', power: 130, isAstro: true, stripes: 3 },
  { id: 'astro-carrier', name: 'Carrier Astro', nameRu: 'Авианосец Астро', emoji: '🚢', category: 'astro', rarity: 'mythic', color: '#000000', accent: '#facc15', description: 'GARGANTUAN 300m', power: 250, isAstro: true, stripes: 1 },
  { id: 'astro-juggernaut', name: 'Juggernaut Astro', nameRu: 'Джаггернаут Астро', emoji: '🦾', category: 'astro', rarity: 'mythic', color: '#1a1a1a', accent: '#fb923c', description: 'Fleet main warrior', power: 200, isAstro: true, stripes: 3 },
  { id: 'astro-duchess', name: 'Duchess Astro', nameRu: 'Герцогиня Астро', emoji: '👑', category: 'astro', rarity: 'mythic', color: '#2e1065', accent: '#c084fc', description: 'Female titan astro', power: 180, isAstro: true, stripes: 2 },
  { id: 'astro-mothership', name: 'Mothership Astro', nameRu: 'Матка Астро', emoji: '🛸', category: 'astro', rarity: 'mythic', color: '#000000', accent: '#ffffff', description: 'COLOSSAL 2500m+ FLEET BASE', power: 999, isAstro: true, stripes: 3 },

  // Titans (Alliance)
  { id: 'titan-cameraman', name: 'Titan Cameraman', nameRu: 'Титан Камерамен', emoji: '📷', category: 'titan', rarity: 'legendary', color: '#374151', accent: '#9ca3af', description: 'Upgraded titan with jetpack', power: 150, isTitan: true },
  { id: 'titan-speakerman', name: 'Titan Speakerman', nameRu: 'Титан Спикермен', emoji: '🔊', category: 'titan', rarity: 'legendary', color: '#dc2626', accent: '#fca5a5', description: 'BOOM BOOM', power: 160, isTitan: true },
  { id: 'titan-tvman', name: 'Titan TV Man', nameRu: 'Титан ТВ Мен', emoji: '📺', category: 'titan', rarity: 'legendary', color: '#111827', accent: '#a78bfa', description: 'Death screen ability', power: 170, isTitan: true },
  { id: 'titan-clockman', name: 'Titan Clockman', nameRu: 'Титан Клокмен', emoji: '⏰', category: 'titan', rarity: 'mythic', color: '#fbbf24', accent: '#f59e0b', description: 'Time stop!', power: 220, isTitan: true },

  // Zombie (new trend 2025)
  { id: 'zombie-normal', name: 'Zombie Skibidi', nameRu: 'Зомби Скибиди', emoji: '🧟‍♂️', category: 'zombie', rarity: 'rare', color: '#14532d', accent: '#22c55e', description: 'New virus outbreak', power: 65, isZombie: true },
  { id: 'zombie-titan-tv', name: 'Zombie Titan TV', nameRu: 'Зомби Титан ТВ', emoji: '📺🧟', category: 'zombie', rarity: 'mythic', color: '#052e16', accent: '#4ade80', description: 'Infected titan', power: 300, isZombie: true, isTitan: true },
  { id: 'zombie-detainer', name: 'Zombie Detainer Astro', nameRu: 'Зомби Детейнер', emoji: '💀', category: 'zombie', rarity: 'mythic', color: '#000000', accent: '#22c55e', description: 'Zombie astro', power: 280, isZombie: true, isAstro: true },

  // Meme viral types (lemon etc)
  { id: 'lemon', name: 'Lemon Skibidi', nameRu: 'Лимон Скибиди', emoji: '🍋', category: 'meme', rarity: 'epic', color: '#fef08a', accent: '#eab308', description: 'When life gives you lemons... SKIBIDI', power: 35 },
  { id: 'sigma', name: 'Sigma Skibidi', nameRu: 'Сигма Скибиди', emoji: '😎', category: 'meme', rarity: 'rare', color: '#000000', accent: '#ffffff', description: 'GYATT RIZZ SIGMA GRINDSET', power: 50 },
  { id: 'ohio', name: 'Ohio Skibidi', nameRu: 'Огайо Скибиди', emoji: '🏚️', category: 'meme', rarity: 'rare', color: '#fb923c', accent: '#f97316', description: 'Only in Ohio 💀', power: 30 },
  { id: 'gigachad', name: 'GigaChad Skibidi', nameRu: 'Гигачад Скибиди', emoji: '💪', category: 'meme', rarity: 'legendary', color: '#1f2937', accent: '#fbbf24', description: 'GIGACHAD toilet', power: 100 },
  { id: 'dog', name: 'Dog Skibidi', nameRu: 'Собака Скибиди', emoji: '🐶', category: 'meme', rarity: 'epic', color: '#a16207', accent: '#facc15', description: 'Bark bark skibidi', power: 40 },
  { id: 'cat', name: 'Cat Skibidi', nameRu: 'Кот Скибиди', emoji: '🐱', category: 'meme', rarity: 'epic', color: '#f5f5f4', accent: '#a8a29e', description: 'Meow skibidi', power: 42 },
  { id: 'egg', name: 'Egg Skibidi', nameRu: 'Яйцо Скибиди', emoji: '🥚', category: 'meme', rarity: 'common', color: '#fef3c7', accent: '#f59e0b', description: 'Eggbidi', power: 8 },
  { id: 'steak', name: 'Steak Skibidi', nameRu: 'Стейк Скибиди', emoji: '🥩', category: 'meme', rarity: 'rare', color: '#7f1d1d', accent: '#ef4444', description: 'Meat toilet', power: 33 },
  { id: 'toilet-paper', name: 'Toilet Paper Skibidi', nameRu: 'Бумага Скибиди', emoji: '🧻', category: 'meme', rarity: 'common', color: '#ffffff', accent: '#e5e7eb', description: 'Self-referential', power: 12 },
  { id: 'golden', name: 'Golden Skibidi Statue', nameRu: 'Золотой Скибиди', emoji: '🏆', category: 'meme', rarity: 'mythic', color: '#facc15', accent: '#eab308', description: 'Monument, not alive', power: 500 },
];

export const RARITY_COLOR: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ef4444',
};

export const BRAINROT_CAPTIONS = [
  "BRRR SKIBIDI DOP DOP DOP YES YES",
  "ONLY IN OHIO 💀💀💀",
  "SIGMA GRINDSET 🗿🍷",
  "GYATT DAMN 😳",
  "RIZZ LEVEL 100 🔥",
  "POV: YOU FOUND {NAME} AT 3AM",
  "WHEN THE {NAME} IS SUS 💀",
  "LEMON SKIBIDI??? 🍋🚽",
  "ASTRO TOILET JUMPSCARE ☄️",
  "TITAN CAMERAMAN VS {NAME}",
  "ZOMBIE VIRUS SPREADING 🧟‍♂️",
  "MUTANT SKIBIDI EVOLUTION",
  "BRAINROT LEVEL: 9999",
  "SKIBIDI TOILET MULTIVERSE",
  "NO WAY {NAME} IS REAL",
  "CHAT IS THIS REAL???",
  "GIGACHAD SKIBIDI SIGMA",
  "OHIO FINAL BOSS 💀",
  "SKIBIDI DOP DOP YES YES YES",
  "CAMERAMAN COUNTERATTACK 📷",
  "SPEAKERMAN BOOM 🔊💥",
  "TV MAN DEATH SCREEN 📺☠️",
  "ASTRO FLEET INVASION 🛸",
  "JUGGERNAUT ASTRO APPEARED",
  "MOTHERSHIP 2500m WTF",
  "LEMON SKIBIDI IN OHIO 🍋",
  "DOG SKIBIDI BARK BARK 🐶",
  "EGGBIDI LORE??? 🥚",
  "GOLDEN SKIBIDI RARE 🤑",
  "ZOMBIE TITAN TV MAN 😱",
  "MUTANT WITH BUZZSAW 🪚",
  "CARRIER ASTRO GARGANTUAN",
  "DUCHESS ASTRO FEMALE?? 👑",
  "SKIBIDI TOILET 78 LEAKED",
  "NEW VIRUS ZOMBIE ARC",
  "TITAN CLOCKMAN TIME STOP ⏰",
  "BRRR SKIBIDI DOP YES YES",
];

export const YT_TITLES = [
  "SKIBIDI TOILET {NAME} JUMPSCARE AT 3AM (NOT CLICKBAIT) 💀",
  "I FOUND {NAME} IN OHIO... (GONE WRONG)",
  "NEW {NAME} LEAKED FROM SKIBIDI TOILET 79 😱",
  "POV: {NAME} APPEARS IN YOUR BATHROOM AT 3AM",
  "ASTRO TOILET FLEET VS TITAN CAMERAMAN - WHO WILL WIN?",
  "ZOMBIE {NAME} VIRUS IS SPREADING (SKIBIDI TOILET ZOMBIE UNIVERSE)",
  "LEMON SKIBIDI TOILET IN REAL LIFE 🍋🚽 (OHIO)",
  "MUTANT SKIBIDI WITH BUZZSAW - MOST CURSED SKIBIDI EVER",
  "GOLDEN SKIBIDI STATUE SECRET LOCATION - SKIBIDI TOILET LORE",
  "TITAN TV MAN VS JUGGERNAUT ASTRO - EPIC BATTLE",
  "I SUMMONED {NAME} USING SKIBIDI RITUAL AT 3AM",
  "SKIBIDI TOILET MULTIVERSE - ALL {CATEGORY} TYPES EXPLAINED",
  "CARRIER ASTRO TOILET SIZE COMPARISON - 300 METERS WTF",
  "MOTHERSHIP ASTRO TOILET 2500m - BIGGEST SKIBIDI EVER",
  "EGGBIDI AND STEAK TOILET - NEW MEME SKIBIDI TYPES",
];

export function getRandomCaption(name: string): string {
  const cap = BRAINROT_CAPTIONS[Math.floor(Math.random() * BRAINROT_CAPTIONS.length)];
  return cap.replace(/{NAME}/g, name.toUpperCase());
}

export function getRandomYTTitle(name: string, category: string): string {
  const t = YT_TITLES[Math.floor(Math.random() * YT_TITLES.length)];
  return t.replace(/{NAME}/g, name.toUpperCase()).replace(/{CATEGORY}/g, category.toUpperCase());
}
