import { useEffect, useRef, useState, useCallback } from 'react';
import { Film3DRenderer } from './skibidi3d/FilmRenderer';
import { skibidiFilm3D, Film3DShot } from './skibidi3d/filmSpec';
import { Skibidi3DGame } from './skibidi3d/SkibidiGame';
import { Hud3D, GamePhase3D } from './skibidi3d/types';
import { SKIBIDI_TYPES } from './skibidi/types';
import {
  Play, Pause, Volume2, VolumeX, Download, Film, Gamepad2,
  Clapperboard, Crown, Zap, Timer, RotateCcw, Eye, Box, Flame,
  Trophy, Heart, Crosshair, Sparkles, Map, Video
} from 'lucide-react';
import { SkibidiAudio } from './skibidi/audio';

type Mode = '3d-film' | '3d-game' | '2d-factory';

export default function App() {
  const canvasFilmRef = useRef<HTMLCanvasElement>(null);
  const canvasGameRef = useRef<HTMLCanvasElement>(null);
  const filmRendererRef = useRef<Film3DRenderer | null>(null);
  const gameRef = useRef<Skibidi3DGame | null>(null);
  const audioRef = useRef<SkibidiAudio | null>(null);

  const [mode, setMode] = useState<Mode>('3d-film');
  const [time, setTime] = useState(0);
  const [shotIdx, setShotIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // game hud
  const [phase, setPhase] = useState<GamePhase3D>('menu');
  const [hud, setHud] = useState<Hud3D>({ hp: 100, maxHp: 100, score: 0, wave: 1, enemies: 0, ammo: 999, time: 0, best: 0 });
  const [feed, setFeed] = useState<{ id: number; text: string; kind: string }[]>([]);
  const feedId = useRef(0);
  const pushFeed = useCallback((t: string, k: string) => {
    const id = ++feedId.current;
    setFeed(f => [...f.slice(-4), { id, text: k, kind: k }]);
    setTimeout(() => setFeed(f => f.filter(x => x.id !== id)), 3500);
  }, []);

  // 3D FILM init
  useEffect(() => {
    if (mode !== '3d-film') return;
    if (!canvasFilmRef.current) return;
    const renderer = new Film3DRenderer(canvasFilmRef.current, skibidiFilm3D, (t, sIdx) => {
      setTime(t);
      setShotIdx(sIdx);
    });
    filmRendererRef.current = renderer;
    renderer.play();

    const audio = new SkibidiAudio();
    audioRef.current = audio;
    audio.play();

    return () => {
      renderer.dispose();
      audio.dispose();
      filmRendererRef.current = null;
      audioRef.current = null;
    };
  }, [mode]);

  // 3D GAME init
  useEffect(() => {
    if (mode !== '3d-game') return;
    if (!canvasGameRef.current) return;
    const game = new Skibidi3DGame(canvasGameRef.current, {
      onHud: setHud,
      onPhase: (p) => setPhase(p),
      onFeed: pushFeed,
    });
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [mode, pushFeed]);

  const togglePlayFilm = () => {
    if (!filmRendererRef.current || !audioRef.current) return;
    if (playing) {
      filmRendererRef.current.pause();
      audioRef.current.stop();
      setPlaying(false);
    } else {
      filmRendererRef.current.play();
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleSeekFilm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    filmRendererRef.current?.seek(t);
    setTime(t);
  };

  const handleStartGame = () => {
    gameRef.current?.start();
    setPhase('playing');
    gameRef.current?.lock();
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    filmRendererRef.current && audioRef.current?.setMuted(m);
    gameRef.current?.setMuted(m);
  };

  const handleExportFilm = async () => {
    if (!filmRendererRef.current || exporting) return;
    setExporting(true);
    const wasPlaying = playing;
    if (wasPlaying) {
      filmRendererRef.current.pause();
      audioRef.current?.stop();
      setPlaying(false);
    }
    try {
      const blob = await filmRendererRef.current.exportWebM(p => setExportProgress(p));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SKIBIDI_3D_FILM_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
      setExportProgress(0);
      if (wasPlaying) {
        filmRendererRef.current?.play();
        audioRef.current?.play();
        setPlaying(true);
      }
    }
  };

  const handleExportGame = async () => {
    if (!gameRef.current || exporting) return;
    setExporting(true);
    try {
      const blob = await gameRef.current.exportWebM(p => setExportProgress(p));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SKIBIDI_3D_GAME_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const currentShot: Film3DShot | undefined = skibidiFilm3D.shots[shotIdx];

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white selection:bg-yellow-400 selection:text-black overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b-2 border-yellow-400 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black text-xl font-black">3D</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-black tracking-tight leading-none">SKIBIDI 3D FILM • HQ VIDEO</h1>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-black">1080×1920 • 30FPS • THREE.JS</span>
              </div>
              <div className="text-[11px] font-bold text-white/40">Процедурное 3D видео для YouTube Shorts • 0 ассетов • как procedural-film но в 3D</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setMode('3d-film')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${mode === '3d-film' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              <Film className="h-3.5 w-3.5" /> 3D FILM
            </button>
            <button onClick={() => setMode('3d-game')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${mode === '3d-game' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              <Gamepad2 className="h-3.5 w-3.5" /> 3D GAME
            </button>
            <button onClick={toggleMute} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white hover:text-black">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={mode === '3d-film' ? handleExportFilm : handleExportGame} disabled={exporting} className="flex items-center gap-1.5 rounded-full bg-yellow-400 px-4 py-1.5 text-[11px] font-black text-black hover:bg-yellow-300 disabled:opacity-50">
              {exporting ? `${Math.round(exportProgress * 100)}%` : <><Download className="h-3.5 w-3.5" /> EXPORT YT SHORTS</>}
            </button>
          </div>
        </div>
      </header>

      {mode === '3d-film' && (
        <div className="mx-auto grid max-w-[1800px] grid-cols-1 lg:grid-cols-[340px_1fr_380px]">
          {/* LEFT - SHOTS */}
          <div className="order-2 border-r border-white/10 bg-[#0f172a]/60 p-4 lg:order-1">
            <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-white/40"><Clapperboard className="h-4 w-4" /> ШОТЫ • {skibidiFilm3D.shots.length} • {skibidiFilm3D.duration}с</div>
            <div className="mt-3 space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {skibidiFilm3D.shots.map((s, i) => (
                <button key={s.id} onClick={() => { const t = skibidiFilm3D.shots.slice(0, i).reduce((a, b) => a + b.duration, 0) + 0.1; filmRendererRef.current?.seek(t); setTime(t); }} className={`w-full rounded-xl border p-2.5 text-left transition-all ${i === shotIdx ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${i === shotIdx ? 'bg-black text-yellow-400' : 'bg-white/10'}`}>{i + 1}</span>
                    <span className="text-[12px] font-black">{s.titleRu}</span>
                    <span className="ml-auto text-[10px] font-bold opacity-60">{s.duration}s</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-snug opacity-70">{s.caption}</div>
                  <div className="mt-1 flex gap-1">
                    {s.spawn.map(id => {
                      const t = SKIBIDI_TYPES.find(x => x.id === id);
                      return <span key={id} className="text-[10px]">{t?.emoji}</span>;
                    })}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-black p-3">
              <div className="text-[11px] font-black text-yellow-400">💡 КАК СДЕЛАНО • HQ 3D</div>
              <div className="mt-2 space-y-1.5 text-[11px] font-bold leading-snug text-white/70">
                <div>• Каждый унитаз — LatheGeometry + Torus rim + вода с emissive</div>
                <div>• Голова — Sphere + CanvasTexture лицо (глаза iris/pupil/highlight, рот с зубами)</div>
                <div>• Город — 26 зданий с оконными текстурами, луна с кратерами, 600 звезд</div>
                <div>• Камера — smoothstep lerp по 12 шотам, FOV меняется</div>
                <div>• Свет — ACESFilmic, PCFSoft тени 2048, fog, moon light</div>
                <div>• 0 внешних моделей — всё процедурно из Box/Sphere/Cylinder</div>
              </div>
            </div>
          </div>

          {/* CENTER - 3D FILM PLAYER */}
          <div className="order-1 flex flex-col items-center bg-[#020617] p-4 lg:order-2">
            <div className="w-full max-w-[460px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-black text-black">3D FILM • {skibidiFilm3D.bpm}BPM</span>
                  <span className="text-[11px] font-bold text-white/40">VERTICAL 1080×1920 • 30FPS</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={togglePlayFilm} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                    {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
                  </button>
                  <button onClick={() => { filmRendererRef.current?.seek(0); setTime(0); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white hover:text-black">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <h2 className="text-[20px] font-black leading-tight">{skibidiFilm3D.titleRu}</h2>
                <p className="text-[11px] font-bold text-white/40">{skibidiFilm3D.title} • {skibidiFilm3D.duration}с • {skibidiFilm3D.shots.length} шотов</p>
              </div>
            </div>

            <div className="relative mt-4 w-full max-w-[460px]">
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[28px] border-[8px] border-[#1a1a1a] bg-black shadow-[0_0_0_2px_#facc15,0_20px_80px_rgba(250,204,21,0.2)]">
                <canvas ref={canvasFilmRef} className="absolute inset-0 h-full w-full" />
                {/* overlay UI inside */}
                <div className="pointer-events-none absolute left-0 right-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-3 pb-8">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-black">REC • 3D FILM</span>
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/70 backdrop-blur">{shotIdx + 1}/{skibidiFilm3D.shots.length} • {currentShot?.titleRu}</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 pt-10">
                  <div className="text-center">
                    <div className="inline-block rounded-full bg-black/70 px-3 py-1 text-[13px] font-black tracking-wide text-white backdrop-blur-md" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      {currentShot?.caption}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={togglePlayFilm} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-black">
                      {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
                    </button>
                    <input type="range" min={0} max={skibidiFilm3D.duration} step={0.05} value={time} onChange={handleSeekFilm} className="h-1 flex-1 appearance-none rounded-full bg-white/20 accent-yellow-400" />
                    <span className="text-[11px] font-black text-white/60">{Math.floor(time)}s</span>
                  </div>
                </div>

                <div className="pointer-events-none absolute left-1/2 top-0 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1a1a1a]" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={togglePlayFilm} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13px] font-black text-black hover:bg-yellow-400">
                  {playing ? <><Pause className="h-4 w-4" /> PAUSE</> : <><Play className="h-4 w-4" /> PLAY 3D FILM</>}
                </button>
                <button onClick={handleExportFilm} disabled={exporting} className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 text-[13px] font-black text-black hover:bg-yellow-300 disabled:opacity-50">
                  {exporting ? `${Math.round(exportProgress * 100)}%` : <><Download className="h-4 w-4" /> EXPORT YT SHORTS</>}
                </button>
              </div>
              <div className="mt-2 text-center text-[11px] font-bold text-white/30">Экспорт 32с • вертикаль 1080×1920 • 30FPS • 8Mbps • готов для YouTube Shorts</div>
            </div>
          </div>

          {/* RIGHT - INFO */}
          <div className="order-3 border-l border-white/10 bg-[#0f172a]/40 p-4 lg:min-h-screen">
            <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-white/40"><Sparkles className="h-4 w-4 text-yellow-400" /> СЕЙЧАС ИГРАЕТ</div>
            {currentShot && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md">
                <div className="text-[14px] font-black">{currentShot.titleRu} • {currentShot.title}</div>
                <div className="mt-1 text-[12px] text-white/60">{currentShot.action}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-white/5 p-2.5"><div className="text-white/40">DURATION</div><div className="font-black">{currentShot.duration}s</div></div>
                  <div className="rounded-xl bg-white/5 p-2.5"><div className="text-white/40">INTENSITY</div><div className="font-black">{Math.round(currentShot.intensity * 100)}%</div></div>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] font-black text-white/30">SPAWN</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {currentShot.spawn.map(id => {
                      const t = SKIBIDI_TYPES.find(x => x.id === id);
                      return <span key={id} className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold">{t?.emoji} {t?.nameRu}</span>;
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-yellow-400 p-4 text-black">
              <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-black/60"><Video className="h-4 w-4" /> YT SHORTS ГОТОВ</div>
              <div className="mt-2 text-[13px] font-black leading-snug">SKIBIDI 3D: {currentShot?.titleRu} — {currentShot?.caption}</div>
              <div className="mt-2 rounded-xl bg-black p-2.5 font-mono text-[11px] text-yellow-400 leading-relaxed">
                #skibiditoilet #skibidi3d #astrotoilet #titancameraman #ohio #shorts #viral #fyp #brainrot #3danimation<br />
                BRRR SKIBIDI DOP DOP YES YES 🚽<br />
                100% THREE.JS • NO ASSETS • PROCEDURAL 3D FILM
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-black tracking-widest text-white/40">ОТЛИЧИЕ ОТ ИГРЫ</div>
              <div className="mt-2 space-y-2 text-[12px] font-bold leading-snug text-white/70">
                <div>• Это <b className="text-white">не игра</b>, а 3D видео — 12 шотов с камерой как в кино</div>
                <div>• Камера летит по кривым: establishing → close-up → dolly → orbit → crane</div>
                <div>• Персонажи анимированы: марш, варп, битва, mouth sync к 140bpm</div>
                <div>• Свет и туман меняются каждый шот</div>
                <div>• Экспорт — 32 секунды готового шортса для ютуба</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === '3d-game' && (
        <>
          <canvas ref={canvasGameRef} className="absolute inset-0 h-full w-full" />
          {phase === 'menu' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0f172a] p-6">
                <h1 className="text-3xl font-black">SKIBIDI 3D GAME</h1>
                <p className="text-[12px] text-white/50">Настоящий 3D шутер • Ohio city • 40 типов скибиди</p>
                <button onClick={handleStartGame} className="mt-4 w-full rounded-xl bg-yellow-400 py-4 font-black text-black">ИГРАТЬ В 3D</button>
                <button onClick={() => setMode('3d-film')} className="mt-2 w-full rounded-xl bg-white/10 py-3 text-[13px] font-black">← ВЕРНУТЬСЯ К 3D ФИЛЬМУ (ВИДЕО)</button>
              </div>
            </div>
          )}
          {phase === 'playing' && (
            <div className="absolute left-3 top-[70px] rounded-2xl bg-black/60 p-3 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[12px] font-black"><Heart className="h-4 w-4 text-red-400" /> {hud.hp} HP</div>
              <div className="text-[11px] text-white/60">{hud.score} PTS • WAVE {hud.wave} • {hud.enemies} ENEMIES</div>
            </div>
          )}
          <div className="absolute right-3 top-[70px] flex flex-col gap-1">
            {feed.map(f => <div key={f.id} className="rounded-xl bg-black/60 px-3 py-1.5 text-[12px] font-bold backdrop-blur-md">{f.text}</div>)}
          </div>
        </>
      )}
    </div>
  );
}


