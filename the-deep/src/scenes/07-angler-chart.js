// 07-angler-chart : blueprint sheet — the anglerfish as an annotated specimen.
FILM.scene({
  id: 'angler-chart',
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

    const k = ease.outCubic(lib.clamp01(t / 1.15)); // draw-on

    // Title block.
    lib.textFit(ctx, 'ОБРАЗЕЦ · MELANOCETUS', W / 2, 150, {
      size: 42,
      weight: '700',
      spacing: 8,
      align: 'center',
      color: lib.pal.paper,
      font: lib.mono,
      maxW: W * 0.82,
    });
    lib.textFit(ctx, 'SHEET 03 · SPECIMEN · ГЛУБИНА 3000–4000 м', W / 2, 208, {
      size: 26,
      weight: '500',
      spacing: 8,
      align: 'center',
      color: lib.pal.navyLine,
      font: lib.mono,
      maxW: W * 0.86,
    });
    ctx.fillStyle = lib.pal.navyLine;
    ctx.fillRect(W * 0.18, 236, W * 0.64 * k, 3);

    // ---- fish outline in local units, facing right ----
    ctx.save();
    ctx.translate(W * 0.44, H * 0.52);
    const S = 1.28;
    ctx.scale(S, S);

    const outline = [
      ['M', 330, -30], // mouth tip
      ['Q', 250, -150, 90, -186], // upper jaw to crown
      ['Q', -60, -210, -170, -128], // back
      ['L', -330, -150], // tail top
      ['Q', -290, -20, -330, 130], // tail bottom
      ['L', -170, 120], // belly back
      ['Q', -40, 205, 140, 148], // belly
      ['Q', 250, 120, 330, -30], // lower jaw
    ];

    const drawOutline = () => {
      ctx.beginPath();
      ctx.moveTo(outline[0][1], outline[0][2]);
      for (let i = 1; i < outline.length; i++) {
        const s = outline[i];
        if (s[0] === 'Q') ctx.quadraticCurveTo(s[1], s[2], s[3], s[4]);
        else ctx.lineTo(s[1], s[2]);
      }
      ctx.closePath();
    };

    ctx.strokeStyle = lib.pal.paper;
    ctx.lineWidth = 5;
    ctx.globalAlpha = k;
    drawOutline();
    ctx.stroke();
    // faint fill
    ctx.fillStyle = 'rgba(242,232,216,0.06)';
    drawOutline();
    ctx.fill();

    // Inner construction lines.
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = lib.pal.navyLine;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(320, -20);
    ctx.quadraticCurveTo(200, 30, 140, 148);
    ctx.stroke(); // jaw hinge line
    ctx.beginPath();
    ctx.moveTo(60, -180);
    ctx.quadraticCurveTo(10, -40, 40, 160);
    ctx.stroke(); // gill arch
    ctx.setLineDash([]);

    // Teeth: triangles pointing inward along both jaws.
    ctx.fillStyle = lib.pal.paper;
    const teeth = [
      [300, -36, 0.9], [258, -84, 0.8], [205, -118, 0.7], [150, -140, 0.6],
      [300, 8, -0.9], [252, 52, -0.8], [196, 92, -0.7], [142, 118, -0.6],
    ];
    for (const [tx, ty, rot] of teeth) {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(Math.PI + (rot > 0 ? -0.5 : 0.5));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(18, 42);
      ctx.lineTo(-18, 42);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Eye.
    ctx.strokeStyle = lib.pal.paper;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(120, -70, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = lib.pal.navy;
    ctx.beginPath();
    ctx.arc(120, -70, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lib.pal.paper;
    ctx.beginPath();
    ctx.arc(112, -78, 7, 0, Math.PI * 2);
    ctx.fill();

    // Dorsal + pectoral fins.
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-40, -190);
    ctx.quadraticCurveTo(-90, -280, -160, -150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, 168);
    ctx.quadraticCurveTo(-60, 250, -130, 170);
    ctx.stroke();

    // Illicium: the rod arcing over the mouth, esca at the tip.
    const rodK = lib.clamp01((k - 0.35) / 0.65);
    ctx.strokeStyle = lib.pal.paper;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(120, -186);
    const tipX = 345 + Math.sin(t * 1.2) * 8;
    const tipY = -268 + Math.cos(t * 1.05) * 8;
    ctx.quadraticCurveTo(240, -320, tipX, tipY);
    ctx.stroke();
    // esca bulb + bacteria glow (magenta callout colour)
    ctx.save();
    ctx.translate(tipX, tipY);
    const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4));
    lib.glow(ctx, 0, 0, 90 * pulse, 'rgba(232,87,127,0.55)', 'rgba(232,87,127,0)');
    ctx.fillStyle = lib.pal.magenta;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lib.pal.navy;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // end fish transform

    // ---- callouts ----
    const callout = (label, sub, lx, ly, tx, ty, delay, align) => {
      const ck = lib.clamp01((k - delay) / 0.35);
      if (ck <= 0) return;
      ctx.save();
      ctx.globalAlpha = ck;
      lib.dashLine(ctx, lx, ly, tx, ty, { color: lib.pal.magenta, width: 3, dash: [10, 8] });
      ctx.fillStyle = lib.pal.magenta;
      ctx.beginPath();
      ctx.arc(tx, ty, 9, 0, Math.PI * 2);
      ctx.fill();
      lib.textFit(ctx, label, lx, ly - 16, {
        size: 30,
        weight: '700',
        spacing: 3,
        color: lib.pal.magenta,
        font: lib.mono,
        align: align || 'left',
        maxW: W * 0.42,
      });
      if (sub) {
        lib.textFit(ctx, sub, lx, ly + 26, {
          size: 24,
          weight: '500',
          spacing: 2,
          color: lib.pal.navyLine,
          font: lib.mono,
          align: align || 'left',
          maxW: W * 0.42,
        });
      }
      ctx.restore();
    };

    // positions computed against the same layout as the fish
    const fishX = W * 0.44;
    const fishY = H * 0.52;
    callout('ЭСКА · СВЕТ', 'бактерии-симбионты', 120, fishY - 320, fishX + 345 * S, fishY - 268 * S, 0.15);
    callout('ИЛЛИЦИУМ', 'удочка 25% тела', 120, fishY - 420, fishX + 200 * S, fishY - 300 * S, 0.3);
    callout('ЗУБЫ', 'не дают добыче вырваться', W - 110, fishY + 300, fishX + 250 * S, fishY + 40 * S, 0.45, 'right');
    callout('ГЛАЗ', 'видит силуэты в темноте', 120, fishY + 300, fishX + 120 * S, fishY - 70 * S, 0.6);

    // Scale bar.
    ctx.save();
    ctx.globalAlpha = lib.clamp01((k - 0.5) / 0.5);
    const by = H - 210;
    ctx.strokeStyle = lib.pal.paper;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * 0.16, by);
    ctx.lineTo(W * 0.16 + 360, by);
    ctx.moveTo(W * 0.16, by - 16);
    ctx.lineTo(W * 0.16, by + 16);
    ctx.moveTo(W * 0.16 + 360, by - 16);
    ctx.lineTo(W * 0.16 + 360, by + 16);
    ctx.stroke();
    lib.text(ctx, '0 — 30 см', W * 0.16 + 180, by + 62, {
      size: 28,
      weight: '600',
      spacing: 3,
      align: 'center',
      color: lib.pal.paper,
      font: lib.mono,
    });
    ctx.restore();
  },
});
