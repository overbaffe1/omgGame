// 06-depth-chart : blueprint sheet — the five ocean zones and the dive path.
FILM.scene({
  id: 'depth-chart',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Sheet.
    ctx.fillStyle = lib.pal.navy;
    ctx.fillRect(0, 0, W, H);
    lib.blueGrid(ctx, { step: 54 });
    lib.corner(ctx, { color: lib.pal.navyLine, len: 52, inset: 42 });

    const k = ease.outCubic(lib.clamp01(t / 1.6)); // draw-on

    // Title block.
    lib.textFit(ctx, 'ГЛУБИНА · РАЗРЕЗ ВОДНОЙ ТОЛЩИ', W / 2, 150, {
      size: 42,
      weight: '700',
      spacing: 8,
      align: 'center',
      color: lib.pal.paper,
      font: lib.mono,
      maxW: W * 0.82,
    });
    lib.textFit(ctx, 'SHEET 02 · DEPTH SECTION', W / 2, 208, {
      size: 28,
      weight: '500',
      spacing: 10,
      align: 'center',
      color: lib.pal.navyLine,
      font: lib.mono,
      maxW: W * 0.7,
    });
    ctx.fillStyle = lib.pal.navyLine;
    ctx.fillRect(W * 0.18, 236, W * 0.64 * k, 3);

    // Zone bands. Depth -> y on a sqrt scale so the deep stays readable.
    const yTop = 320;
    const yBot = H - 320;
    const yOf = (d) => yTop + (yBot - yTop) * Math.sqrt(d / 11000);
    const zones = [
      { name: 'ЭПИПЕЛАГИАЛЬ', d0: 0, d1: 200 },
      { name: 'МЕЗОПЕЛАГИАЛЬ', d0: 200, d1: 1000 },
      { name: 'БАТИПЕЛАГИАЛЬ', d0: 1000, d1: 4000 },
      { name: 'АБИССОПЕЛАГИАЛЬ', d0: 4000, d1: 6000 },
      { name: 'ХАДАЛЬ', d0: 6000, d1: 11000 },
    ];

    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      const zr = i / zones.length;
      const zk = lib.clamp01((k - zr * 0.55) / 0.45);
      if (zk <= 0) continue;
      const y0 = yOf(z.d0);
      const y1 = yOf(z.d1);

      // band fill
      ctx.save();
      ctx.globalAlpha = 0.10 * zk;
      ctx.fillStyle = i % 2 === 0 ? lib.pal.navyLine : lib.pal.magenta;
      ctx.fillRect(W * 0.16, y0, W * 0.68, y1 - y0);
      ctx.restore();

      // top rule
      ctx.strokeStyle = lib.pal.navyLine;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = zk;
      ctx.beginPath();
      ctx.moveTo(W * 0.16, y0);
      ctx.lineTo(W * 0.16 + W * 0.68 * zk, y0);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // labels
      const midY = (y0 + y1) / 2;
      lib.text(ctx, z.name, W * 0.16 + 18, midY - 12, {
        size: 30,
        weight: '600',
        spacing: 4,
        color: lib.pal.paper,
        font: lib.mono,
        alpha: zk,
      });
      lib.text(ctx, z.d0 + '–' + z.d1.toLocaleString('ru-RU') + ' м', W * 0.84 - 18, midY - 12, {
        size: 28,
        weight: '500',
        spacing: 2,
        align: 'right',
        color: lib.pal.navyLine,
        font: lib.mono,
        alpha: zk,
      });

      // magenta depth tick on the left rail
      ctx.fillStyle = lib.pal.magenta;
      ctx.globalAlpha = zk;
      ctx.fillRect(W * 0.16 - 10, y0 - 2, 20, 4);
      ctx.globalAlpha = 1;
    }

    // Left depth rail.
    ctx.strokeStyle = lib.pal.navyLine;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.16, yOf(0));
    ctx.lineTo(W * 0.16, yOf(11000));
    ctx.stroke();

    // Dive path: a wandering line from the surface to the trench floor.
    const pathX = (yn) => W * 0.26 + yn * W * 0.4 + Math.sin(yn * Math.PI * 1.7) * W * 0.11;
    ctx.strokeStyle = lib.pal.magenta;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.setLineDash([4200 * k, 4200]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const yn = i / 60;
      const x = pathX(yn);
      const y = yOf(yn * 11000);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Marker running down the path (magenta crosshair).
    const dk = ease.inOutSine(lib.clamp01(t / 2.6));
    const dNow = 120 + dk * 10500;
    const yn = dNow / 11000;
    const mx = pathX(yn);
    const my = yOf(dNow);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(Math.atan2(yOf(dNow + 200) - my, pathX(Math.min(1, yn + 0.02)) - mx));
    ctx.fillStyle = lib.pal.magenta;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(-18, -16);
    ctx.lineTo(-18, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = lib.pal.magenta;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(mx, my, 30, 0, Math.PI * 2);
    ctx.stroke();
    lib.text(ctx, Math.round(dNow / 10) * 10 + ' м', mx + 44, my + 12, {
      size: 32,
      weight: '700',
      color: lib.pal.magenta,
      font: lib.mono,
    });

    // Shot stamps along the path: where the film has been.
    const stamps = [
      { d: 60, n: '02' },
      { d: 220, n: '03' },
      { d: 700, n: '04' },
      { d: 1800, n: '05' },
    ];
    for (const s of stamps) {
      const yn2 = s.d / 11000;
      const sx = pathX(yn2);
      const sy = yOf(s.d);
      lib.dashLine(ctx, sx, sy, W * 0.86, sy, { color: lib.pal.navyLine, alpha: 0.5, width: 2, dash: [8, 8] });
      ctx.fillStyle = lib.pal.paper;
      ctx.fillRect(sx - 22, sy - 22, 44, 44);
      lib.text(ctx, s.n, sx, sy + 12, {
        size: 28,
        weight: '700',
        align: 'center',
        color: lib.pal.navy,
        font: lib.mono,
      });
    }

    // Sheet stamp, bottom right.
    ctx.save();
    ctx.translate(W - 340, H - 210);
    ctx.rotate(-0.03);
    ctx.strokeStyle = lib.pal.navyLine;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 300, 128);
    lib.textFit(ctx, 'ГЛУБИНА / THE DEEP', 150, 52, {
      size: 24,
      weight: '700',
      spacing: 2,
      align: 'center',
      color: lib.pal.paper,
      font: lib.mono,
      maxW: 270,
    });
    lib.textFit(ctx, 'МАСШТАБ √ · 1:11 000', 150, 98, {
      size: 20,
      weight: '500',
      spacing: 2,
      align: 'center',
      color: lib.pal.navyLine,
      font: lib.mono,
      maxW: 270,
    });
    ctx.restore();
  },
});
