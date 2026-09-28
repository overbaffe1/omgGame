// 01-title-surface : cold open over sunlit waves, the title punches in on the beat.
FILM.scene({
  id: 'title-surface',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Camera tilt: the last second leans toward the water.
    const tilt = ease.inOutSine(lib.clamp01((t - 2.0) / 1.0));
    ctx.save();
    ctx.translate(0, -tilt * 110);
    ctx.scale(1 + tilt * 0.07, 1 + tilt * 0.07);

    // Sky at dawn.
    const horizon = H * 0.30;
    lib.gradV(ctx, -80, -160, W + 160, horizon + 180, [
      [0, '#f8dfae'],
      [0.45, '#f2e7d2'],
      [1, '#a8cbe8'],
    ]);

    // Sun glow above the horizon.
    lib.glow(ctx, W * 0.66, horizon * 0.42, W * 0.55, 'rgba(255,232,170,0.85)', 'rgba(255,232,170,0)');
    lib.dot(ctx, W * 0.66, horizon * 0.42, 46, '#fff4d6', 0.95);

    // Sea: stacked wavy bands, bright at the horizon, deep at the bottom.
    const bands = 22;
    const amp = (k) => 5 + k * 30;
    const waveY = (x, i, k, tt) => {
      const y = horizon + (H + 220 - horizon) * Math.pow(k, 1.42);
      return (
        y +
        Math.sin(x * 0.006 + tt * 0.85 + i * 0.72) * amp(k) +
        lib.noise1(x * 0.0021 + tt * 0.22, 40 + i) * amp(k) * 0.8
      );
    };

    for (let i = 0; i < bands; i++) {
      const k = i / bands;
      const k2 = (i + 1) / bands;
      const c1 = lib.mix('#9fd8ff', '#0c3f7c', Math.pow(k, 0.8));
      const c2 = lib.mix('#9fd8ff', '#0c3f7c', Math.pow(k2, 0.8));
      const g = ctx.createLinearGradient(0, horizon + (H - horizon) * k, 0, horizon + (H - horizon) * k2 + 140);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-120, waveY(-120, i, k, t));
      for (let x = -120; x <= W + 120; x += 26) ctx.lineTo(x, waveY(x, i, k, t));
      for (let x = W + 120; x >= -120; x -= 26) ctx.lineTo(x, waveY(x, i + 1, k2, t) + 4);
      ctx.closePath();
      ctx.fill();

      // crest line
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.10 + 0.16 * (1 - k)) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = -120; x <= W + 120; x += 26) {
        const yy = waveY(x, i, k, t);
        if (x <= -120) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // Sun glitter column: hash-blinking sparkles.
    const glit = 110;
    for (let i = 0; i < glit; i++) {
      const r1 = lib.hash(i, 1, 3);
      const r2 = lib.hash(i, 2, 5);
      const r3 = lib.hash(i, 3, 7);
      const x = W * 0.66 + (r1 - 0.5) * W * (0.18 + r2 * 0.72);
      const y = horizon + 30 + r2 * (H - horizon) * 0.86;
      const tw = Math.sin(t * (2.2 + r3 * 3.4) + r3 * 21);
      const a = Math.max(0, tw) * (0.25 + 0.75 * (1 - r2));
      if (a < 0.04) continue;
      const s = 3 + r3 * 9;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r3 * Math.PI);
      ctx.strokeStyle = 'rgba(255,244,214,' + a + ')';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(s, 0);
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(0, s * 0.7);
      ctx.stroke();
      ctx.restore();
    }

    // Warm reflection wash under the sun (radial so it never seams).
    ctx.save();
    ctx.globalAlpha = 0.2;
    const rg = ctx.createRadialGradient(W * 0.66, horizon + 40, 20, W * 0.66, horizon + 40, W * 0.72);
    rg.addColorStop(0, 'rgba(255,226,160,0.9)');
    rg.addColorStop(0.55, 'rgba(255,226,160,0.35)');
    rg.addColorStop(1, 'rgba(255,226,160,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, horizon - 60, W, H - horizon + 60);
    ctx.restore();

    ctx.restore(); // end camera

    // ------------------------------------------------------------------
    // Title
    // ------------------------------------------------------------------
    const pop = ease.outBack(lib.clamp01((t - 0.5) / 0.55));
    const popA = lib.clamp01((t - 0.5) / 0.35);
    if (popA > 0) {
      ctx.save();
      const cy = H * 0.47;
      ctx.translate(W / 2, cy);
      ctx.scale(0.86 + pop * 0.14, 0.86 + pop * 0.14);
      ctx.translate(-W / 2, -cy);
      // soft shadow plate
      ctx.globalAlpha = popA * 0.35;
      const pg = ctx.createLinearGradient(0, cy - 190, 0, cy + 120);
      pg.addColorStop(0, 'rgba(4,16,31,0)');
      pg.addColorStop(0.5, 'rgba(4,16,31,0.55)');
      pg.addColorStop(1, 'rgba(4,16,31,0)');
      ctx.fillStyle = pg;
      ctx.fillRect(0, cy - 190, W, 310);
      ctx.globalAlpha = 1;

      lib.textFit(ctx, 'ГЛУБИНА', W / 2, cy, {
        size: 172,
        weight: '800',
        spacing: 26,
        align: 'center',
        color: '#fdf6e8',
        font: lib.sans,
        alpha: popA,
        maxW: W * 0.88,
      });
      ctx.restore();
    }

    // rule + subtitle settle at 1.0 s
    const subA = lib.clamp01((t - 1.0) / 0.6);
    if (subA > 0) {
      const y = H * 0.47 + 150;
      ctx.save();
      ctx.globalAlpha = subA;
      const wRule = 420 * ease.outCubic(subA);
      ctx.strokeStyle = 'rgba(253,246,232,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - wRule / 2, y - 58);
      ctx.lineTo(W / 2 + wRule / 2, y - 58);
      ctx.stroke();
      lib.text(ctx, 'THE DEEP', W / 2, y + 8, {
        size: 44,
        weight: '600',
        spacing: 22,
        align: 'center',
        color: '#fdf6e8',
        font: lib.sans,
      });
      lib.text(ctx, 'процедурный фильм', W / 2, y + 78, {
        size: 34,
        weight: '400',
        spacing: 8,
        align: 'center',
        color: 'rgba(253,246,232,0.85)',
        font: lib.sans,
      });
      ctx.restore();
    }
  },
});
