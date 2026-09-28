// 12-credits : rising bubbles, one last jelly, the credits settle in, end card.
FILM.scene({
  id: 'credits',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Deep water, gently lifting toward a memory of light.
    lib.gradV(ctx, 0, 0, W, H, [
      [0, '#051426'],
      [0.55, '#030d1c'],
      [1, '#02060e'],
    ]);
    lib.glow(ctx, W * 0.5, -H * 0.15, W * 1.1, 'rgba(90,150,210,0.16)', 'rgba(90,150,210,0)');

    // Rising bubbles, big and slow.
    lib.bubbles(ctx, t, { count: 22, speed: 90, seed: 141, alpha: 0.5, rMax: 34 });

    // One last jelly pulsing high in frame.
    lib.jelly(ctx, t, {
      x: W * 0.5 + Math.sin(t * 0.5) * 20,
      y: H * 0.2 + Math.sin(t * 0.6) * 18,
      r: 120,
      phase: 0.25,
      alpha: 0.8,
      color: 'rgba(200,230,255,0.45)',
      color2: 'rgba(140,190,255,0.18)',
      glowColor: 'rgba(130,200,255,0.4)',
      tentacles: 7,
      tent: 2.6,
    });

    lib.snow(ctx, t, { count: 30, speed: -14, seed: 142, alpha: 0.3, rMin: 1.5, rMax: 4 });

    // ---- credit stack ----
    const lines = [
      ['ГЛУБИНА', 64, 0.0],
      ['THE DEEP · A PROCEDURAL FILM', 28, 0.35],
      ['', 20, 0.55],
      ['нарисовано в JavaScript', 36, 0.7],
      ['озвучено в Web Audio', 36, 1.05],
      ['ноль медиафайлов', 36, 1.4],
      ['', 20, 1.6],
      ['по мотивам procedural-film', 28, 1.75],
    ];
    let y = H * 0.44;
    for (const [str, size, delay] of lines) {
      const a = ease.outCubic(lib.clamp01((t - 0.4 - delay) / 0.6));
      if (str && a > 0) {
        lib.text(ctx, str, W / 2, y, {
          size,
          weight: size > 40 ? '800' : '500',
          spacing: size > 40 ? 16 : 4,
          align: 'center',
          color: '#e8eef7',
          font: size > 40 ? lib.sans : lib.sans,
          alpha: a,
        });
      }
      y += size * 2.1;
    }

    // ---- end card on the last beats ----
    const endA = ease.outBack(lib.clamp01((t - 2.2) / 0.6));
    const endO = lib.clamp01((t - 2.2) / 0.35);
    if (endO > 0) {
      ctx.save();
      ctx.translate(W / 2, H * 0.79);
      ctx.scale(0.8 + endA * 0.2, 0.8 + endA * 0.2);
      lib.text(ctx, 'КОНЕЦ', 0, 0, {
        size: 96,
        weight: '800',
        spacing: 30,
        align: 'center',
        color: '#fdf6e8',
        font: lib.sans,
        alpha: endO,
      });
      // rule under the end card
      const rw = 220 * endA;
      ctx.strokeStyle = 'rgba(253,246,232,0.8)';
      ctx.lineWidth = 3;
      ctx.globalAlpha = endO;
      ctx.beginPath();
      ctx.moveTo(-rw, 52);
      ctx.lineTo(rw, 52);
      ctx.stroke();
      ctx.restore();
    }
  },
});
