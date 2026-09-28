// 12-versus : ЛИМОН vs АПЕЛЬСИН. Кто победил — в комменты.
FILM.scene({
  id: 'versus',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // split backgrounds
    ctx.fillStyle = '#2E7CFF';
    ctx.fillRect(0, 0, W / 2, H);
    ctx.fillStyle = '#FF3B30';
    ctx.fillRect(W / 2, 0, W / 2, H);
    lib.rays(ctx, t, { x: W * 0.25, y: H * 0.5, speed: 0.7, count: 10, alpha: 0.25 });
    lib.rays(ctx, -t, { x: W * 0.75, y: H * 0.5, speed: 0.7, count: 10, alpha: 0.25 });

    const sh = lib.shake(t, 7, 41);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // lemon fighter (left)
    const bounceL = Math.abs(Math.sin(t * Math.PI * 3));
    lib.lemonChar(ctx, t, {
      x: W * 0.26,
      y: H * 0.52 - bounceL * 46,
      r: 165,
      mood: 'angry',
      bounce: 0,
    });

    // orange fighter (right) — round cousin
    const bounceR = Math.abs(Math.sin(t * Math.PI * 3 + Math.PI));
    ctx.save();
    ctx.translate(W * 0.74, H * 0.52 - bounceR * 46);
    // body
    const g = ctx.createRadialGradient(-40, -60, 20, 0, 0, 190);
    g.addColorStop(0, '#FFB86B');
    g.addColorStop(0.6, '#FF8A00');
    g.addColorStop(1, '#E06A00');
    ctx.fillStyle = g;
    ctx.strokeStyle = lib.pal.ink;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // leaf
    ctx.fillStyle = '#37D67A';
    ctx.beginPath();
    ctx.ellipse(30, -175, 52, 22, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // angry face
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#FFFFFF';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.ellipse(side * 58, -20, 38, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = lib.pal.ink;
      ctx.beginPath();
      ctx.arc(side * 48, -14, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(side * 22, -78);
      ctx.lineTo(side * 88, -52);
      ctx.stroke();
    }
    ctx.fillStyle = '#7A1B1B';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-52, 68);
    ctx.quadraticCurveTo(0, 40, 52, 68);
    ctx.quadraticCurveTo(0, 102, -52, 68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // fists up
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#FF8A00';
      ctx.beginPath();
      ctx.arc(side * 190, 40 - bounceR * 18, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // VS bolt
    const vs = lib.ease.outElastic(lib.beat(t, 1.2));
    ctx.save();
    ctx.translate(W / 2, H * 0.5);
    ctx.rotate(-0.08);
    ctx.scale(0.8 + vs * 0.35, 0.8 + vs * 0.35);
    ctx.fillStyle = lib.pal.lemon;
    ctx.strokeStyle = lib.pal.ink;
    ctx.lineWidth = 18;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-150, -170);
    ctx.lineTo(60, -170);
    ctx.lineTo(-10, -40);
    ctx.lineTo(140, -40);
    ctx.lineTo(-150, 190);
    ctx.lineTo(-50, 20);
    ctx.lineTo(-170, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    lib.impact(ctx, 'VS', 0, 30, { size: 150, fill: lib.pal.red, maxW: 260, strokeW: 16 });
    ctx.restore();
    ctx.restore();

    // captions
    const cs = lib.ease.outBack(lib.clamp01(t / 0.25));
    lib.impact(ctx, 'КТО ПОБЕДИЛ?', W / 2, H * 0.12, {
      size: 132,
      scale: 1.7 - cs * 0.7,
      fill: lib.pal.white,
      maxW: W * 0.88,
    });
    if (t > 0.8) {
      lib.impact(ctx, 'ПИШИ В КОММЕНТЫ', W / 2, H * 0.9, {
        size: 104,
        alpha: lib.clamp01((t - 0.8) / 0.25),
        scale: 0.8 + lib.beat(t - 0.8, 0.8) * 0.25,
        fill: lib.pal.lemon,
        maxW: W * 0.85,
      });
    }
  },
});
