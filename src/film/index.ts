import { robotFilm } from './films/robot';
import { sporeFilm } from './films/spore';
import { signalFilm } from './films/signal';
import { FilmSpec } from './types';
import { hashString, mulberry32 } from './engine/rng';

export const allFilms: FilmSpec[] = [robotFilm, sporeFilm, signalFilm];

export function getFilmById(id: string): FilmSpec | undefined {
  return allFilms.find(f => f.id === id);
}

// Procedural generation from arbitrary topic string
export function generateFilmFromTopic(topic: string): FilmSpec {
  const seed = hashString(topic.toLowerCase().trim());
  const rng = mulberry32(seed);

  // pick base template randomly but influenced by topic keywords
  const lower = topic.toLowerCase();
  let base: FilmSpec;
  if (lower.includes('робот') || lower.includes('robot') || lower.includes('машин')) base = robotFilm;
  else if (lower.includes('гриб') || lower.includes('спор') || lower.includes('раст') || lower.includes('mushroom') || lower.includes('seed') || lower.includes('лес')) base = sporeFilm;
  else if (lower.includes('сигнал') || lower.includes('космос') || lower.includes('signal') || lower.includes('space') || lower.includes('спутник')) base = signalFilm;
  else base = allFilms[Math.floor(rng() * allFilms.length)];

  // clone and mutate
  const mutated: FilmSpec = JSON.parse(JSON.stringify(base));
  mutated.id = `gen-${seed}`;
  mutated.title = topic.toUpperCase().slice(0, 32);
  mutated.titleRu = topic.slice(0, 32);
  mutated.logline = `Procedural film about "${topic}" — generated entirely in JavaScript.`;
  mutated.loglineRu = `Процедурный фильм про "${topic}" — полностью нарисован кодом.`;

  // mutate seeds and intensities
  mutated.shots = mutated.shots.map((s, i) => ({
    ...s,
    seed: Math.floor(rng() * 100000) + i * 997,
    intensity: Math.max(0.15, Math.min(0.95, s.intensity + (rng() - 0.5) * 0.3)),
    duration: Math.max(1.2, s.duration + (rng() - 0.5) * 0.6),
  }));

  // recalc duration
  mutated.duration = mutated.shots.reduce((a, b) => a + b.duration, 0);

  // mutate palette slightly
  const shift = (hex: string, amount: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.max(0, Math.min(255, r + (rng() - 0.5) * amount));
    const ng = Math.max(0, Math.min(255, g + (rng() - 0.5) * amount));
    const nb = Math.max(0, Math.min(255, b + (rng() - 0.5) * amount));
    return `#${Math.floor(nr).toString(16).padStart(2, '0')}${Math.floor(ng).toString(16).padStart(2, '0')}${Math.floor(nb).toString(16).padStart(2, '0')}`;
  };

  mutated.palette = {
    paper: shift(base.palette.paper, 20),
    ink: base.palette.ink,
    accent: shift(base.palette.accent, 60),
    blueprint: base.palette.blueprint,
    blueprintInk: shift(base.palette.blueprintInk, 40),
  };

  return mutated;
}
