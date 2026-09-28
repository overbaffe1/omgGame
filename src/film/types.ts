export type FilmMode = 'paper' | 'blueprint' | 'night' | 'memory';

export interface FilmShot {
  id: string;
  title: string;
  titleRu: string;
  duration: number; // seconds
  mode: FilmMode;
  // narrative
  action: string;
  // visual params
  seed: number;
  intensity: number; // 0-1 for music
}

export interface FilmSpec {
  id: string;
  title: string;
  titleRu: string;
  logline: string;
  loglineRu: string;
  duration: number;
  fps: number;
  bpm: number;
  width: number;
  height: number;
  shots: FilmShot[];
  palette: {
    paper: string;
    ink: string;
    accent: string;
    blueprint: string;
    blueprintInk: string;
  };
}

export interface FrameContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number; // global time 0..duration
  shotTime: number; // time inside shot
  shotProgress: number; // 0..1 inside shot
  shotIndex: number;
  shot: FilmShot;
  film: FilmSpec;
  globalProgress: number;
  rng: () => number;
  // for drawing
  tick: number; // frame number
}

export type DrawFunc = (c: FrameContext) => void;
