// FILM.TIMELINE: the shot list for «ГЛУБИНА» / THE DEEP.
// 120 bpm: a beat is 0.5 s (12 frames at 24 fps). Every cut sits on the beat grid.
// Human-readable plan: storyboard.md.
(function () {
  'use strict';
  const FILM = window.FILM;

  FILM.TIMELINE = {
    title: 'ГЛУБИНА',
    titleEn: 'THE DEEP',
    bpm: 120,
    duration: 36.5,
    fps: 24,
    width: 1080,
    height: 1920,
    shots: [
      {
        id: 'title-surface',
        start: 0,
        end: 3,
        mode: 'ink',
        title: 'Зеркало',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'Cold open: sunlit waves seen from above at dawn, glitter boiling on the swell. The title punches in on the 0.5 s beat, the subtitle settles at 1.0 s, and the last second tilts down toward the water.',
      },
      {
        id: 'sunbeams',
        start: 3,
        end: 5.5,
        mode: 'ink',
        title: 'Свет',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'Just under the surface looking up: the wavy mirror above, god rays breathing down, two parallax layers of fish silhouettes crossing, bubbles rising from below.',
      },
      {
        id: 'reef',
        start: 5.5,
        end: 8.5,
        mode: 'ink',
        title: 'Риф',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'A coral garden on the photic floor: fan and branch corals, kelp swaying on the beat, two schools threading past, fainter sun shafts, the camera pushing in slowly.',
      },
      {
        id: 'descent',
        start: 8.5,
        end: 11,
        mode: 'ink',
        title: 'Спуск',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'Open water greying out as the camera sinks. A lone jelly sinks past marine snow; a depth ruler on the right ticks through 40–200 m with a magenta marker.',
      },
      {
        id: 'jelly-bloom',
        start: 11,
        end: 14,
        mode: 'ink',
        title: 'Сияние',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'A bloom of moon jellies backlit from above, bells squashing and stretching on every beat, oral arms drifting, small fish weaving between them.',
      },
      {
        id: 'depth-chart',
        start: 14,
        end: 17,
        mode: 'chart',
        title: 'Разрез',
        transitionIn: { kind: 'fade', dur: 0.5 },
        brief:
          'Blueprint sheet: the five ocean zones drawn on as ruled bands with depths 0–11 000 m, a magenta dive path with a descending marker, dashed leaders and a corner stamp.',
      },
      {
        id: 'angler-chart',
        start: 17,
        end: 19,
        mode: 'chart',
        title: 'Образец',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'Second blueprint sheet: the anglerfish as an annotated specimen in side view — teeth, illicium and glowing esca called out in magenta, a scale bar below.',
      },
      {
        id: 'anglerfish',
        start: 19,
        end: 22,
        mode: 'ink',
        title: 'Удочка',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'Near-black midnight zone. The lure bobs and glows on the beat, a small fish drifts toward it, and at 21.0 s the jaws snap shut on a white flash — then the dark closes again.',
      },
      {
        id: 'whale-fall',
        start: 22,
        end: 25.5,
        mode: 'ink',
        title: 'Кит',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'A whale skeleton resting on the abyssal plain under heavy marine snow: spine arc, ribs, skull, scavengers crawling, a hagfish ribbon near the ribcage. Slow pan across the bones.',
      },
      {
        id: 'vent',
        start: 25.5,
        end: 29,
        mode: 'ink',
        title: 'Курильщик',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'A black smoker: mineral chimney billowing dark particles, glowing cracks at the base, tube worms swaying with red plumes, heat shimmer rising, vent shrimp on the rocks.',
      },
      {
        id: 'trench',
        start: 29,
        end: 33,
        mode: 'ink',
        title: 'Жёлоб',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'The trench walls in a V. A tiny submersible drifts left, two warm cones sweeping the rock face and lighting dust, the depth readout climbing to 10 935 m, a siphonophore hanging in the dark.',
      },
      {
        id: 'credits',
        start: 33,
        end: 36.5,
        mode: 'ink',
        title: 'Конец',
        transitionIn: { kind: 'fade', dur: 0.5 },
        brief:
          'Deep water and rising bubbles, one last jelly pulsing. The credits settle in stack, the end card lands on the final beat, and the frame fades to black.',
      },
    ],
  };
})();
