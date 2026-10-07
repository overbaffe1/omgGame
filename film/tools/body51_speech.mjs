// body51_speech.mjs — точное выравнивание титров по речи.
// Берём mp3, находим паузы (silencedetect) → получаем «отрезки речи»,
// затем раскладываем предложения по этим отрезкам пропорционально длине.
import { spawnSync } from 'node:child_process';

const FF = o => (o && o.ffmpeg) || process.env.FFMPEG_BIN || 'ffmpeg';

// → {dur, onset, offset, spans:[[t0,t1],...], pauses:[[t0,t1],...]}
export function speechSpans(file, { noise = '-36dB', min = 0.10, ffmpeg = null } = {}) {
  const r = spawnSync(FF({ ffmpeg }), ['-hide_banner', '-i', file, '-af', `silencedetect=noise=${noise}:d=${min}`, '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 1 << 26 });
  const err = r.stderr || '';
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(err);
  const dur = m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0;
  const starts = [...err.matchAll(/silence_start: ([\d.]+)/g)].map(x => parseFloat(x[1]));
  const ends = [...err.matchAll(/silence_end: ([\d.]+)/g)].map(x => parseFloat(x[1]));
  const pauses = [];
  for (let i = 0; i < starts.length; i++) {
    const s = Math.max(0, starts[i]);
    const e = ends[i] != null ? Math.min(dur, ends[i]) : dur;
    if (e > s) pauses.push([s, e]);
  }
  const spans = [];
  let cursor = 0;
  for (const [s, e] of pauses) {
    if (s - cursor > 0.02) spans.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (dur - cursor > 0.02) spans.push([cursor, dur]);
  const onset = spans.length ? spans[0][0] : 0;
  const offset = spans.length ? spans[spans.length - 1][1] : dur;
  const speech = spans.length ? +(offset - onset).toFixed(3) : dur;   // если разметить не вышло — считаем речью весь файл
  return { dur, onset: spans.length ? onset : 0, offset: spans.length ? offset : dur, speech, spans, pauses };
}

export const sentences = txt => (txt || '').trim().split(/(?<=[.!?…])\s+/).filter(Boolean);

// раскладываем строки по отрезкам речи: каждая строка получает своё окно [t0,t1]
export function segmentsFor(spec, lines, { gapHold = 0.0 } = {}) {
  if (!spec || !spec.spans.length || !lines.length) return [];
  const totalSpeech = spec.spans.reduce((s, [a, b]) => s + (b - a), 0);
  const weights = lines.map(l => Math.max(1, l.replace(/\s+/g, ' ').length));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const out = [];
  let si = 0, pos = spec.spans[0][0], left = 0;
  for (let i = 0; i < lines.length; i++) {
    const want = (weights[i] / sumW) * totalSpeech;
    let got = 0;
    const t0 = pos;
    while (got < want - 0.005) {
      const [_, se] = spec.spans[si];
      const take = Math.min(want - got, se - pos);
      got += take; pos += take;
      if (pos >= se - 0.005) { si = Math.min(spec.spans.length - 1, si + 1); pos = spec.spans[si][0]; }
    }
    out.push({ t0: +t0.toFixed(2), t1: +Math.min(pos, spec.offset).toFixed(2), text: lines[i] });
  }
  return out;
}
