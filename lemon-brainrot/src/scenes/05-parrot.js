// 05-parrot : LIMONCHELLO PAROTTO flies over the city dropping juice bombs.
FILM.scene({
  id: 'parrot',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // sky
    lib.rays(ctx, t * 0.3, { speed: 0.18, count: 10, alpha: 1, colors: ['#3ED8FF', '#7FE9FF', '#2E7CFF', '#9FF0FF'] });
    // clouds
    for (let i = 0; i < 5; i++) {
      const r = lib.hash(i, 21, 1);
      const x = ((t * (40 + r * 50) + r * W * 1.7) % (W * 1.5)) - W * 0.2;
      const y = H * (0.1 + r * 0.28);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let c = 0; c < 4; c++) {
        ctx.beginPath();
        ctx.arc(x + c * 60 - 90, y + Math.sin(c * 2) * 18, 55 + lib.hash(c, i, 2) * 30, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // city bottom
    const colors = ['#37485C', '#2C3A4C', '#41566E', '#243244'];
    for (let i = 0; i < 6; i++) {
      lib.building(ctx, i * 200 - 40, H * 0.97, 170, 260 + lib.hash(i, 31, 1) * 320, colors[i % 4], i);
    }

    // fly path: arc across the frame
    const k = lib.clamp01(t / 2.8);
    const fx = -200 + k * (W + 400);
    const fy = H * 0.3 + Math.sin(k * Math.PI * 1.2) * 120 + Math.sin(t * 6) * 22;
    const flap = Math.sin(t * 9);

    const sh = lib.shake(t, 5, 13);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // speed lines behind
    lib.speedLines(ctx, t, { x: fx, y: fy, count: 26, r0: 220, len: 260, color: 'rgba(255,255,255,0.7)', alpha: 0.5 });

    // wings
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(fx, fy + 20);
      ctx.rotate(side * (0.5 + flap * 0.55));
      ctx.fillStyle = '#FFB100';
      ctx.strokeStyle = lib.pal.ink;
      ctx.lineWidth = 12;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * 210, -110);
      ctx.lineTo(side * 320, -40);
      ctx.lineTo(side * 180, 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // feathers
      for (let f = 0; f < 3; f++) {
        ctx.beginPath();
        ctx.moveTo(side * (120 + f * 50), -60 + f * 12);
        ctx.lineTo(side * (150 + f * 60), 20 + f * 10);
        ctx.stroke();
      }
      ctx.restore();
    }

    // body = lemon with parrot beak
    lib.lemonHead(ctx, t, { x: fx, y: fy, r: 150, mood: 'angry' });
    // beak
    ctx.fillStyle = '#FF8A00';
    ctx.strokeStyle = lib.pal.ink;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(fx + 150, fy - 10);
    ctx.quadraticCurveTo(fx + 300, fy + 20, fx + 160, fy + 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // crest
    for (let f = 0; f < 3; f++) {
      ctx.fillStyle = '#FF4FA3';
      ctx.beginPath();
      ctx.moveTo(fx - 20 + f * 40, fy - 150);
      ctx.lineTo(fx + 10 + f * 40, fy - 240 - f * 20);
      ctx.lineTo(fx + 46 + f * 40, fy - 140);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // juice bombs falling on beats
    for (let i = 0; i < 4; i++) {
      const bt = 0.5 + i * 0.7;
      const dt = t - bt;
      if (dt > 0 && dt < 1.1) {
        const bx = fx - 120 - i * 60;
        const by = fy + 120 + dt * dt * 2400;
        if (by < H * 0.86) {
          // droplet
          ctx.fillStyle = '#FFE14D';
          ctx.strokeStyle = lib.pal.ink;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.ellipse(bx, by, 34, 46, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          lib.explosion(ctx, bx, H * 0.86, 120, dt - 0.28);
        }
      }
    }
    ctx.restore();

    // captions
    const words = ['ФИУ', 'ФИУ', 'БАМ!'];
    const wi = Math.min(2, Math.floor(t / 0.9));
    const cs = lib.ease.outBack(lib.beat(t, 0.9));
    lib.impact(ctx, words[wi], W / 2, H * 0.86, {
      size: wi === 2 ? 220 : 150,
      scale: 0.5 + cs * 0.6,
      rotate: (wi - 1) * 0.05,
      fill: wi === 2 ? lib.pal.red : lib.pal.white,
      maxW: W * 0.6,
    });
    if (t > 1.8) {
      lib.impact(ctx, 'ЛИМОНЧЕЛЛО ПАРОТТО', W / 2, H * 0.13, {
        size: 92,
        alpha: lib.clamp01((t - 1.8) / 0.3),
        fill: lib.pal.lemon,
        maxW: W * 0.88,
        strokeW: 10,
      });
    }
  },
});
