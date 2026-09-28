export interface Film3DShot {
  id: string;
  title: string;
  titleRu: string;
  duration: number;
  camStart: { pos: [number, number, number]; look: [number, number, number]; fov?: number };
  camEnd: { pos: [number, number, number]; look: [number, number, number]; fov?: number };
  action: string;
  caption: string;
  intensity: number;
  spawn: string[]; // skibidi type ids to spawn
}

export interface Film3DSpec {
  id: string;
  title: string;
  titleRu: string;
  duration: number;
  bpm: number;
  shots: Film3DShot[];
}

export const skibidiFilm3D: Film3DSpec = {
  id: 'astro-invasion',
  title: 'SKIBIDI: ASTRO INVASION',
  titleRu: 'СКИБИДИ: ВТОРЖЕНИЕ АСТРО',
  duration: 32,
  bpm: 140,
  shots: [
    {
      id: 's1',
      title: 'OHIO NIGHT',
      titleRu: 'НОЧЬ В ОГАЙО',
      duration: 2.5,
      camStart: { pos: [0, 22, 38], look: [0, 2, 0], fov: 65 },
      camEnd: { pos: [8, 14, 24], look: [0, 1, 0], fov: 72 },
      action: 'establishing city, fog, moon',
      caption: 'POV: OHIO AT 3AM 💀',
      intensity: 0.2,
      spawn: [],
    },
    {
      id: 's2',
      title: 'EMERGE',
      titleRu: 'ПОЯВЛЕНИЕ',
      duration: 2.2,
      camStart: { pos: [-6, 1.2, 6], look: [0, 0.8, 0], fov: 75 },
      camEnd: { pos: [-3, 1.5, 4], look: [0, 1, 0], fov: 70 },
      action: 'manhole opens, normal skibidi emerges singing',
      caption: 'BRRR SKIBIDI DOP DOP YES YES 🚽',
      intensity: 0.5,
      spawn: ['normal'],
    },
    {
      id: 's3',
      title: 'MARCH',
      titleRu: 'МАРШ',
      duration: 2.8,
      camStart: { pos: [0, 3, 12], look: [0, 0.5, -4], fov: 70 },
      camEnd: { pos: [0, 2, -12], look: [0, 0.5, 0], fov: 75 },
      action: 'army of toilets marching down road',
      caption: 'SKIBIDI ARMY MARCHING 💀💀💀',
      intensity: 0.65,
      spawn: ['normal', 'small', 'large', 'normal', 'small'],
    },
    {
      id: 's4',
      title: 'TITAN ARRIVES',
      titleRu: 'ТИТАН ПРИБЫЛ',
      duration: 2.6,
      camStart: { pos: [18, 8, 12], look: [-2, 3, 0], fov: 60 },
      camEnd: { pos: [10, 5, 6], look: [0, 2, 0], fov: 68 },
      action: 'titan cameraman on rooftop',
      caption: 'TITAN CAMERAMAN APPEARED 📷🔥',
      intensity: 0.8,
      spawn: ['titan-cameraman'],
    },
    {
      id: 's5',
      title: 'ASTRO WARP',
      titleRu: 'ВАРП АСТРО',
      duration: 2.4,
      camStart: { pos: [0, 6, 10], look: [0, 2, 0], fov: 75 },
      camEnd: { pos: [0, 3, 5], look: [0, 1, 0], fov: 80 },
      action: 'astro trooper warps with light',
      caption: 'ASTRO TROOPER WARP 🛸💥',
      intensity: 0.9,
      spawn: ['astro-trooper', 'astro-specialist'],
    },
    {
      id: 's6',
      title: 'BATTLE 1',
      titleRu: 'БИТВА 1',
      duration: 3.0,
      camStart: { pos: [-8, 2.5, 8], look: [2, 1, 0], fov: 72 },
      camEnd: { pos: [8, 2.5, 8], look: [-2, 1, 0], fov: 72 },
      action: 'cameraman shoots, astro dodges, lasers',
      caption: 'CAMERAMAN VS ASTRO ☄️📷',
      intensity: 0.95,
      spawn: ['titan-cameraman', 'astro-trooper', 'astro-strider'],
    },
    {
      id: 's7',
      title: 'MUTANT',
      titleRu: 'МУТАНТ',
      duration: 2.2,
      camStart: { pos: [2, 1, 3], look: [0, 1, 0], fov: 85 },
      camEnd: { pos: [-2, 1.8, 3.5], look: [0, 1.2, 0], fov: 75 },
      action: 'buzzsaw mutant appears',
      caption: 'BUZZSAW MUTANT JUMPSCARE 🪚😱',
      intensity: 0.9,
      spawn: ['buzzsaw', 'mutant-normal'],
    },
    {
      id: 's8',
      title: 'SPEAKER BOOM',
      titleRu: 'БУМ СПИКЕРА',
      duration: 2.5,
      camStart: { pos: [0, 4, 14], look: [0, 2, 0], fov: 65 },
      camEnd: { pos: [0, 2, 7], look: [0, 1.5, 0], fov: 70 },
      action: 'titan speakerman boom attack',
      caption: 'TITAN SPEAKERMAN BOOM 🔊💥💥',
      intensity: 1.0,
      spawn: ['titan-speakerman'],
    },
    {
      id: 's9',
      title: 'MOTHERSHIP',
      titleRu: 'МАТКА',
      duration: 3.2,
      camStart: { pos: [0, 2, 18], look: [0, 18, -30], fov: 55 },
      camEnd: { pos: [0, 8, 22], look: [0, 12, -20], fov: 50 },
      action: 'mothership 2500m appears in sky, huge',
      caption: 'MOTHERSHIP 2500m WTF 🛸👑☄️',
      intensity: 1.0,
      spawn: ['astro-mothership'],
    },
    {
      id: 's10',
      title: 'FINAL STAND',
      titleRu: 'ФИНАЛ',
      duration: 3.0,
      camStart: { pos: [-12, 6, 12], look: [4, 2, -2], fov: 68 },
      camEnd: { pos: [12, 5, 10], look: [-4, 2, 0], fov: 72 },
      action: 'all titans unite, final blast',
      caption: 'ALL TITANS UNITE 🔥📷🔊📺',
      intensity: 1.0,
      spawn: ['titan-cameraman', 'titan-speakerman', 'titan-tvman', 'titan-clockman'],
    },
    {
      id: 's11',
      title: 'LEMON TWIST',
      titleRu: 'ЛИМОН ТВИСТ',
      duration: 2.6,
      camStart: { pos: [1, 1.2, 2.5], look: [0, 0.8, 0], fov: 80 },
      camEnd: { pos: [-1, 1.4, 2.2], look: [0, 0.9, 0], fov: 78 },
      action: 'lemon skibidi appears as joke',
      caption: 'LEMON SKIBIDI IN OHIO 🍋🚽💀💀💀',
      intensity: 0.6,
      spawn: ['lemon'],
    },
    {
      id: 's12',
      title: 'OUTRO',
      titleRu: 'КОНЦОВКА',
      duration: 3.0,
      camStart: { pos: [0, 18, 26], look: [0, 0, 0], fov: 70 },
      camEnd: { pos: [0, 28, 36], look: [0, 0, 0], fov: 60 },
      action: 'pull back over city, all skibidi dancing',
      caption: 'SKIBIDI TOILET MULTIVERSE • LIKE & SUB 💀',
      intensity: 0.5,
      spawn: ['normal', 'astro-trooper', 'titan-cameraman', 'lemon', 'golden'],
    },
  ],
};
