// 11-trench : the V of the trench. A submersible sweeps its lights across the wall.
FILM.scene({
  id: 'trench',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Hadal dark.
    lib.gradV(ctx, 0, 0, W, H, [
      [0, '#020916'],
      [0.5, '#020712'],
      [1, '#01050c'],
    ]);

    // ---- trench walls: a V, left and right ----
    const wallPath = (side) => {
      ctx.beginPath();
      const inner = (y) => {
        const k = y / H;
        const vee = Math.pow(1 - Math.abs(k - 0.62) * 1.25, 1.6);
        const x = side < 0 ? W * 0.02 + vee * W * 0.34 : W * 0.98 - vee * W * 0.34;
        return x + lib.noise1(y * 0.003 + side * 9, 3) * 46;
      };
      ctx.moveTo(side < 0 ? -60 : W + 60, -60);
      ctx.lineTo(side < 0 ? -60 : W + 60, H + 60);
      for (let y = H + 60; y >= -60; y -= 40) ctx.lineTo(inner(y), y);
      ctx.closePath();
    };

    for (const side of [-1, 1]) {
      wallPath(side);
      const g = ctx.createLinearGradient(side < 0 ? 0 : W, 0, side < 0 ? W * 0.42 : W * 0.58, 0);
      g.addColorStop(0, '#12294a');
      g.addColorStop(1, '#061428');
      ctx.fillStyle = g;
      ctx.fill();

      // strata lines
      ctx.save();
      wallPath(side);
      ctx.clip();
      ctx.strokeStyle = 'rgba(110,155,210,0.28)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) {
        const y = 60 + i * ((H - 60) / 14);
        ctx.beginPath();
        ctx.moveTo(side < 0 ? -40 : W * 0.5, y + lib.noise1(i, 5) * 22);
        ctx.lineTo(side < 0 ? W * 0.42 : W + 40, y + lib.noise1(i + 40, 6) * 34);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ---- siphonophore hanging in the dark (right side) ----
    ctx.save();
    ctx.translate(W * 0.86, 0);
    ctx.strokeStyle = 'rgba(150,190,235,0.30)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const k = i / 24;
      const y = H * 0.12 + k * H * 0.55;
      const x = Math.sin(t * 0.5 + k * 3.4) * 44 * k;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i <= 14; i++) {
      const k = i / 14;
      const y = H * 0.12 + k * H * 0.55;
      const x = Math.sin(t * 0.5 + k * 3.4) * 44 * k;
      lib.dot(ctx, x, y, 8 + k * 5, 'rgba(170,210,250,0.35)', 1);
    }
    ctx.restore();

    // ---- submersible ----
    // It drifts left, then holds around t = 2.0 while the lights sweep wide.
    const hold = ease.inOutSine(lib.clamp01((t - 1.7) / 0.5));
    const subX = W * 0.46 - t * 26 - hold * 40;
    const subY = H * 0.32 + Math.sin(t * 0.7) * 26;

    // Light beams first (behind the hull).
    const sweepWide = Math.sin(lib.clamp01((t - 1.7) / 1.3) * Math.PI) * 0.35;
    for (const [ang0, flip] of [[0.62, 1], [1.05, -1]]) {
      const ang = ang0 + Math.sin(t * 0.55 + flip) * (0.12 + sweepWide);
      const len = W * 1.1;
      const dirX = Math.cos(ang) * flip;
      const dirY = Math.sin(ang);
      const g = ctx.createLinearGradient(subX, subY, subX + dirX * len, subY + dirY * len);
      g.addColorStop(0, 'rgba(255,217,160,0.30)');
      g.addColorStop(0.35, 'rgba(255,217,160,0.12)');
      g.addColorStop(1, 'rgba(255,217,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(subX, subY);
      const half = 0.24;
      ctx.lineTo(subX + Math.cos(ang - half) * len * flip, subY + Math.sin(ang - half) * len);
      ctx.lineTo(subX + Math.cos(ang + half) * len * flip, subY + Math.sin(ang + half) * len);
      ctx.closePath();
      ctx.fill();
    }

    // Dust motes: brighter inside the beams.
    for (let i = 0; i < 70; i++) {
      const r1 = lib.hash(i, 131, 1);
      const r2 = lib.hash(i, 132, 2);
      const x = r1 * W + lib.noise1(t * 0.2 + i, 8) * 30;
      const y = ((r2 * H + t * 14) % H);
      const dx = x - subX;
      const dy = y - subY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ang = Math.atan2(dy, dx);
      const near = Math.max(0, Math.cos((ang - 0.83) * 3.2)) * Math.max(0, 1 - dist / (W * 1.1));
      const near2 = Math.max(0, Math.cos((ang - (Math.PI - 0.83)) * 3.2)) * Math.max(0, 1 - dist / (W * 1.1));
      const lit = Math.max(near, near2);
      lib.dot(ctx, x, y, 1.5 + r1 * 3, '#ffe6c2', 0.12 + lit * 0.75);
    }

    // Hull.
    ctx.save();
    ctx.translate(subX, subY);
    ctx.rotate(Math.sin(t * 0.5) * 0.06);
    // body
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 120, 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a84e';
    ctx.beginPath();
    ctx.ellipse(-20, 18, 110, 44, 0, 0, Math.PI);
    ctx.fill();
    // dome
    ctx.fillStyle = 'rgba(160,220,255,0.9)';
    ctx.beginPath();
    ctx.arc(34, -18, 36, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a7430';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(34, -18, 36, Math.PI, 0);
    ctx.stroke();
    // thrusters
    ctx.fillStyle = '#8a7430';
    ctx.fillRect(-150, -34, 44, 24);
    ctx.fillRect(-150, 16, 44, 24);
    // lamps
    lib.glow(ctx, 96, -6, 60, 'rgba(255,230,180,0.9)', 'rgba(255,230,180,0)');
    lib.glow(ctx, 96, 30, 52, 'rgba(255,230,180,0.8)', 'rgba(255,230,180,0)');
    // antenna
    ctx.strokeStyle = '#8a7430';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-40, -60);
    ctx.lineTo(-56, -120);
    ctx.stroke();
    lib.dot(ctx, -56, -120, 9, '#e8577f', 0.9);
    ctx.restore();

    // ---- depth readout, bottom right ----
    const depth = Math.round(10812 + ease.outCubic(lib.clamp01(t / 3.2)) * 123);
    ctx.save();
    ctx.globalAlpha = 0.9;
    lib.text(ctx, 'ГЛУБИНА', W - 88, H - 190, {
      size: 30,
      weight: '500',
      spacing: 8,
      align: 'right',
      color: 'rgba(160,195,235,0.7)',
      font: lib.mono,
    });
    lib.text(ctx, depth.toLocaleString('ru-RU') + ' м', W - 88, H - 110, {
      size: 58,
      weight: '700',
      spacing: 4,
      align: 'right',
      color: lib.pal.magenta,
      font: lib.mono,
    });
    ctx.restore();

    lib.text(ctx, 'ХАДАЛЬ · ЖЁЛОБ', 72, H - 96, {
      size: 32,
      weight: '500',
      spacing: 5,
      color: 'rgba(120,160,205,0.5)',
      font: lib.mono,
    });
  },
});
