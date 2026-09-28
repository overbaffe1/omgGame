// 04-descent : open water greying out as the camera sinks; a depth ruler ticks down.
FILM.scene({
  id: 'descent',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Water greys out as we sink: interpolate two column palettes over the shot.
    const k = ease.inOutSine(lib.clamp01(t / 2.5));
    const cTop = lib.mix('#14528e', '#0a2c56', k);
    const cMid = lib.mix('#0a3a6e', '#061e40', k);
    const cBot = lib.mix('#062a52', '#04122b', k);
    lib.gradV(ctx, 0, 0, W, H, [
      [0, cTop],
      [0.5, cMid],
      [1, cBot],
    ]);

    // Sinking: everything drifts upward past the camera.
    const sink = t * 90;

    // Faint surface memory at the very top, sliding away.
    ctx.save();
    ctx.translate(0, -sink * 0.9);
    ctx.globalAlpha = Math.max(0, 0.5 - t * 0.18);
    const sg = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    sg.addColorStop(0, 'rgba(190,228,255,0.8)');
    sg.addColorStop(1, 'rgba(190,228,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H * 0.35);
    ctx.restore();

    // The lone jelly, sinking slower than the camera — it drifts up in frame
    // then settles near center.
    const jellyY = H * 0.62 - t * 26;
    lib.jelly(ctx, t, {
      x: W * 0.44 + Math.sin(t * 0.5) * 26,
      y: jellyY,
      r: 150,
      phase: 0,
      alpha: 0.9,
      color: 'rgba(190,225,255,0.5)',
      color2: 'rgba(120,180,255,0.2)',
      glowColor: 'rgba(120,190,255,0.35)',
      tentacles: 7,
      tent: 3.0,
    });

    // Marine snow rising past us (camera falls).
    lib.snow(ctx, t, {
      count: 70,
      speed: 150 + k * 120,
      seed: 17,
      alpha: 0.42,
      rMin: 1.5,
      rMax: 6,
      drift: 30,
    });

    // Occasional bigger detritus flakes.
    lib.snow(ctx, t, {
      count: 10,
      speed: 220,
      seed: 23,
      alpha: 0.3,
      rMin: 6,
      rMax: 13,
      drift: 16,
      color: '#bcd8ea',
    });

    // ---- depth ruler (right edge) ----
    const x0 = W - 132;
    const yTop = H * 0.16;
    const yBot = H * 0.84;
    ctx.save();
    ctx.strokeStyle = 'rgba(170,205,235,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, yTop);
    ctx.lineTo(x0, yBot);
    ctx.stroke();

    const ticks = 12;
    for (let i = 0; i <= ticks; i++) {
      const y = yTop + ((yBot - yTop) * i) / ticks;
      const long = i % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + (long ? 42 : 22), y);
      ctx.stroke();
      if (long) {
        lib.text(ctx, String(20 + i * 16), x0 + 54, y + 10, {
          size: 26,
          weight: '500',
          color: 'rgba(170,205,235,0.75)',
          font: lib.mono,
        });
      }
    }

    // Marker: magenta, descending smoothly through the ruler.
    const depth = 40 + ease.inOutSine(lib.clamp01(t / 2.5)) * 560; // metres
    const my = yTop + ((yBot - yTop) * (depth - 20)) / (ticks * 16);
    const mA = lib.clamp01(t / 0.4);
    ctx.globalAlpha = mA;
    ctx.fillStyle = lib.pal.magenta;
    ctx.beginPath();
    ctx.moveTo(x0 - 26, my);
    ctx.lineTo(x0 + 4, my - 17);
    ctx.lineTo(x0 + 4, my + 17);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x0 + 4, my - 2, 132, 4);
    lib.text(ctx, Math.round(depth) + ' м', x0 - 44, my + 14, {
      size: 46,
      weight: '700',
      align: 'right',
      color: lib.pal.magenta,
      font: lib.mono,
    });
    ctx.restore();

    // Zone tag.
    lib.text(ctx, 'МЕЗОПЕЛАГИАЛЬ · 200–1000 м', 72, H - 96, {
      size: 34,
      weight: '500',
      spacing: 6,
      color: 'rgba(180,210,235,0.65)',
      font: lib.mono,
    });
  },
});
