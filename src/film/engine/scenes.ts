import { FrameContext } from '../types';
import {
  clearPaper, drawPaperTexture, drawGrid, vignette, drawGroundLine,
  drawRobot, drawSeed, drawTree, drawFlower, drawLabel, drawTape,
  wobblyLine, hatchArea, cameraShake
} from './drawUtils';
import { randRange } from './rng';

// Helpers shared
function drawSky(c: FrameContext, stars = true) {
  const { ctx, width, height, shot, rng, shotProgress } = c;
  if (shot.mode === 'blueprint' || shot.mode === 'night') {
    // stars
    if (stars) {
      ctx.save();
      ctx.fillStyle = 'rgba(180,210,255,0.9)';
      const count = shot.mode === 'night' ? 120 : 60;
      for (let i = 0; i < count; i++) {
        const x = (rng() * width + shotProgress * 20) % width;
        const y = rng() * height * 0.65;
        const s = rng() * 1.8 + 0.3;
        const tw = Math.sin(shotProgress * 10 + i) * 0.5 + 0.5;
        ctx.globalAlpha = tw * 0.8 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } else {
    // sun
    const sunX = width * 0.75;
    const sunY = height * 0.18 + Math.sin(shotProgress * 0.5) * 10;
    ctx.save();
    ctx.fillStyle = 'rgba(251,191,36,0.18)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.film.palette.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    // rays wobbly
    ctx.strokeStyle = 'rgba(251,191,36,0.4)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + shotProgress * 0.3;
      const x1 = sunX + Math.cos(ang) * 32;
      const y1 = sunY + Math.sin(ang) * 32;
      const x2 = sunX + Math.cos(ang) * (55 + rng() * 10);
      const y2 = sunY + Math.sin(ang) * (55 + rng() * 10);
      wobblyLine(ctx, x1, y1, x2, y2, 2, 4, rng);
    }
    ctx.restore();
  }
}

function drawClouds(c: FrameContext, count = 3) {
  const { ctx, width, rng, shotProgress } = c;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = (rng() * width * 1.2 - width * 0.1) + shotProgress * (20 + i * 10);
    const y = 120 + i * 55 + Math.sin(shotProgress * 2 + i) * 8;
    const s = 0.8 + rng() * 0.6;
    ctx.fillStyle = c.shot.mode === 'blueprint' ? 'rgba(160,200,255,0.15)' : 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = c.film.palette.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const r = 28 * s;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.8, y - r * 0.2, r * 0.8, 0, Math.PI * 2);
    ctx.arc(x + r * 1.5, y, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r * 0.6, y + r * 0.3, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    if (c.shot.mode !== 'blueprint') ctx.stroke();
  }
  ctx.restore();
}

function drawDistantMountains(c: FrameContext) {
  const { ctx, width, height, rng, film, shot } = c;
  ctx.save();
  ctx.strokeStyle = shot.mode === 'blueprint' ? film.palette.blueprintInk : film.palette.ink;
  ctx.lineWidth = 2;
  ctx.fillStyle = shot.mode === 'blueprint' ? 'rgba(20,40,80,0.5)' : 'rgba(200,190,170,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.55);
  let x = 0;
  while (x < width) {
    const h = 40 + rng() * 60;
    const nx = x + 80 + rng() * 120;
    const ny = height * 0.55 - h;
    ctx.quadraticCurveTo(x + (nx - x) * 0.5, ny - 20, nx, height * 0.55);
    x = nx;
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// === ROBOT FILM SHOTS ===
function drawRobotShot(c: FrameContext) {
  const { ctx, width, height, shot, shotProgress, shotTime, rng } = c;
  const groundY = height * 0.78;

  switch (shot.id) {
    case 's1': { // VOID
      clearPaper(c);
      drawPaperTexture(c, 0.8);
      drawDistantMountains(c);
      drawGroundLine(c, groundY);
      drawSky(c, false);
      // wind lines
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const y = groundY - 120 - i * 28 + Math.sin(shotTime * 3 + i) * 8;
        const x1 = (shotProgress * 600 + i * 90) % (width + 200) - 100;
        const x2 = x1 + 120 + rng() * 80;
        wobblyLine(ctx, x1, y, x2, y + (rng() - 0.5) * 8, 2, 6, rng);
      }
      ctx.restore();
      // title card
      drawLabel(c, 'МИР БЕЗ ЗВУКА', width * 0.08, height * 0.12, { size: 22 });
      drawLabel(c, 'ВЕТЕР • ПЫЛЬ • ТИШИНА', width * 0.08, height * 0.12 + 28, { size: 12, mono: true, color: 'rgba(0,0,0,0.5)' });
      break;
    }
    case 's2': { // AWAKEN blueprint
      clearPaper(c);
      drawGrid(c);
      drawPaperTexture(c, 0.5);
      // blueprint robot
      const cx = width * 0.5;
      const cy = height * 0.52;
      ctx.save();
      ctx.translate(cx, cy);
      const scale = 2.2;
      // schematic lines
      ctx.strokeStyle = 'rgba(168,208,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-100, 0);
      ctx.lineTo(100, 0);
      ctx.moveTo(0, -120);
      ctx.lineTo(0, 120);
      ctx.stroke();
      // measurements
      drawLabel(c, 'UNIT: R-01', cx - 90, cy - 110, { size: 10, mono: true, color: 'rgba(168,208,255,0.7)' });
      drawLabel(c, 'STATUS: BOOTING...', cx - 90, cy + 130, { size: 10, mono: true, color: 'rgba(168,208,255,0.9)' });
      // robot schematic
      ctx.strokeStyle = c.film.palette.blueprintInk;
      ctx.lineWidth = 2;
      ctx.strokeRect(-30 * scale, -40 * scale, 60 * scale, 50 * scale);
      ctx.strokeRect(-26 * scale, -65 * scale, 52 * scale, 28 * scale);
      // eyes blink
      const blink = Math.sin(shotProgress * Math.PI * 6) > 0.8 ? 0.1 : 1;
      ctx.fillStyle = '#a8d0ff';
      ctx.fillRect(-14 * scale, -58 * scale, 8 * scale, 8 * scale * blink);
      ctx.fillRect(6 * scale, -58 * scale, 8 * scale, 8 * scale * blink);
      ctx.restore();
      break;
    }
    case 's3': { // FIRST STEP
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      drawSky(c, false);
      const walk = Math.max(0, (shotProgress - 0.2) * 2);
      drawRobot(c, width * 0.5 + Math.sin(walk) * 4, groundY, 2.1, { walk: walk * 3 });
      // wobble lines indicating first step
      if (shotProgress > 0.3 && shotProgress < 0.7) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const ang = -Math.PI / 2 + (rng() - 0.5) * 0.6;
          const len = 20 + rng() * 20;
          const x = width * 0.5 + Math.cos(ang) * 10;
          const y = groundY + 10 + Math.sin(ang) * 10;
          wobblyLine(ctx, x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, 1, 3, rng);
        }
        ctx.restore();
      }
      break;
    }
    case 's4': { // WALK
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      drawSky(c);
      drawClouds(c, 2);
      const walk = shotProgress * 6;
      const x = width * 0.2 + shotProgress * width * 0.6;
      drawRobot(c, x, groundY, 1.9, { walk });
      // footprints
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let i = 0; i < 6; i++) {
        const fx = width * 0.2 + (shotProgress * width * 0.6) - i * 48;
        if (fx > 0) {
          ctx.beginPath();
          ctx.ellipse(fx, groundY + 4, 12, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 's5': { // FLOWER
      clearPaper(c, '#fff7e8');
      drawPaperTexture(c, 0.7);
      drawGroundLine(c, groundY);
      drawSky(c, false);
      const x = width * 0.5;
      drawFlower(c, x + 60, groundY, 1.4, 0.9 + Math.sin(shotTime * 2) * 0.1);
      drawRobot(c, x - 50, groundY, 1.8, { walk: 0, look: 0.6 });
      // heart
      if (shotProgress > 0.4) {
        ctx.save();
        ctx.translate(x - 20, groundY - 80);
        ctx.scale(0.8 + Math.sin(shotTime * 4) * 0.15, 0.8 + Math.sin(shotTime * 4) * 0.15);
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(-12, -8, -2, -14, 0, -4);
        ctx.bezierCurveTo(2, -14, 12, -8, 0, 6);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 's6': { // STORM blueprint
      clearPaper(c);
      drawGrid(c);
      cameraShake(c, shotProgress < 0.8 ? 4 + shotProgress * 8 : 0);
      const x = width * 0.5;
      // storm lines diagonal
      ctx.save();
      ctx.strokeStyle = 'rgba(168,208,255,0.6)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 30; i++) {
        const sx = (rng() * width + shotProgress * 400) % width;
        const sy = rng() * height;
        const len = 40 + rng() * 60;
        wobblyLine(ctx, sx, sy, sx + len * 0.3, sy + len, 3, 4, rng);
      }
      ctx.restore();
      // flower breaking
      const flowerX = x + 60 + (rng() - 0.5) * shotProgress * 40;
      const flowerY = groundY + shotProgress * 20;
      drawFlower(c, flowerX, flowerY, 1.2 * (1 - shotProgress * 0.6), 0.9 - shotProgress * 0.8);
      drawRobot(c, x - 50 + shotProgress * 10, groundY, 1.8, { walk: shotProgress * 2, sad: shotProgress });
      // debris
      ctx.fillStyle = 'rgba(168,208,255,0.4)';
      for (let i = 0; i < 8; i++) {
        const dx = (rng() * width + shotProgress * 300) % width;
        const dy = rng() * height * 0.7;
        ctx.beginPath();
        ctx.arc(dx, dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 's7': { // SEED
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      // close up of hands holding seed
      const cx = width * 0.5;
      const cy = height * 0.5;
      ctx.save();
      ctx.translate(cx, cy);
      // hands schematic
      ctx.strokeStyle = c.film.palette.ink;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      // left hand
      ctx.beginPath();
      ctx.moveTo(-60, 20);
      ctx.quadraticCurveTo(-30, 10, -10, 0);
      ctx.stroke();
      // right hand
      ctx.beginPath();
      ctx.moveTo(60, 20);
      ctx.quadraticCurveTo(30, 10, 10, 0);
      ctx.stroke();
      ctx.restore();
      drawSeed(c, cx, cy - 4, 2.5, 0);
      drawRobot(c, cx, groundY, 1.2, { carry: true });
      // glow
      ctx.save();
      ctx.fillStyle = 'rgba(163,230,53,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 40 + Math.sin(shotTime * 3) * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 's8': { // NIGHT
      clearPaper(c, '#0f1221');
      drawPaperTexture(c, 0.3);
      // big stars + constellations blueprint
      ctx.save();
      ctx.strokeStyle = 'rgba(120,160,255,0.25)';
      ctx.lineWidth = 1;
      // constellation lines
      const stars = [];
      for (let i = 0; i < 12; i++) {
        stars.push({ x: rng() * width * 0.8 + width * 0.1, y: rng() * height * 0.45 + 40 });
      }
      for (let i = 0; i < stars.length - 1; i++) {
        if (rng() > 0.3) {
          wobblyLine(ctx, stars[i].x, stars[i].y, stars[i + 1].x, stars[i + 1].y, 1, 6, rng);
        }
      }
      ctx.fillStyle = 'rgba(200,220,255,0.9)';
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2 + rng() * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      drawGroundLine(c, groundY);
      drawRobot(c, width * 0.5, groundY, 1.7, { look: -0.3 });
      // robot looking up line
      ctx.save();
      ctx.strokeStyle = 'rgba(200,220,255,0.2)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(width * 0.5, groundY - 60);
      ctx.lineTo(width * 0.5 - 40, height * 0.25);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 's9': { // PLAN blueprint
      clearPaper(c);
      drawGrid(c);
      const cx = width * 0.5;
      const cy = height * 0.5;
      // blueprint plan
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = c.film.palette.blueprintInk;
      ctx.lineWidth = 2;
      // hole
      ctx.beginPath();
      ctx.arc(0, 20, 18 + shotProgress * 8, 0, Math.PI * 2);
      ctx.stroke();
      // arrow
      wobblyLine(ctx, -60, -40, 0, 20, 1, 8, rng);
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.lineTo(0, 20);
      ctx.lineTo(6, 12);
      ctx.stroke();
      // seed icon
      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.arc(0, -30, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // labels
      ctx.restore();
      drawLabel(c, 'OPERATION: GREEN', cx - 90, cy - 100, { size: 12, mono: true, color: 'rgba(168,208,255,0.9)' });
      drawLabel(c, 'DEPTH: 0.4m', cx + 30, cy + 30, { size: 10, mono: true, color: 'rgba(168,208,255,0.6)' });
      drawRobot(c, width * 0.22, groundY, 1.4, { look: 0.8 });
      break;
    }
    case 's10': { // DIG
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      const digProgress = shotProgress;
      const cx = width * 0.5;
      // hole getting bigger
      ctx.save();
      ctx.fillStyle = '#3a2a1a';
      ctx.strokeStyle = c.film.palette.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 6, 14 + digProgress * 18, 6 + digProgress * 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // dirt particles
      for (let i = 0; i < 12; i++) {
        if (rng() < digProgress) {
          const px = cx + (rng() - 0.5) * 80;
          const py = groundY - rng() * 40 * digProgress;
          ctx.fillStyle = 'rgba(60,40,20,0.6)';
          ctx.beginPath();
          ctx.arc(px, py, 2 + rng() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      drawRobot(c, cx - 20, groundY, 1.8, { walk: digProgress * 8 });
      break;
    }
    case 's11': { // PLANT
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      const cx = width * 0.5;
      // hole
      ctx.fillStyle = '#3a2a1a';
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 6, 32, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c.film.palette.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      // seed placed
      drawSeed(c, cx, groundY + 2, 1.6, 0);
      drawRobot(c, cx - 30, groundY, 1.7, { walk: 0 });
      // watering can
      if (shotProgress > 0.3) {
        ctx.save();
        ctx.translate(cx - 10, groundY - 40);
        ctx.rotate(-0.3 + Math.sin(shotTime * 4) * 0.1);
        ctx.strokeStyle = c.film.palette.ink;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-12, -10, 24, 18);
        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(22, -12);
        ctx.stroke();
        // water drops
        if (shotProgress > 0.5) {
          ctx.fillStyle = 'rgba(56,189,248,0.7)';
          for (let i = 0; i < 5; i++) {
            const dy = (shotTime * 80 + i * 20) % 50;
            ctx.beginPath();
            ctx.arc(22, -12 + dy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
      break;
    }
    case 's12': { // WAIT memory
      clearPaper(c, '#f6f0e3');
      drawPaperTexture(c, 0.6);
      drawGroundLine(c, groundY);
      // time lapse sun arc
      const sunProg = shotProgress;
      const sunX = width * 0.15 + sunProg * width * 0.7;
      const sunY = height * 0.25 + Math.sin(sunProg * Math.PI) * -80;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c.film.palette.ink;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // robot sitting
      const rx = width * 0.5;
      drawRobot(c, rx, groundY, 1.6, { walk: 0 });
      // small seed still
      drawSeed(c, rx + 50, groundY + 2, 1.2, shotProgress * 0.3);
      // clock doodle
      drawLabel(c, `${Math.floor(sunProg * 12) + 6}:00`, width * 0.08, height * 0.12, { size: 12, mono: true });
      break;
    }
    case 's13': { // SPROUT
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      drawSky(c, false);
      const sprout = shotProgress;
      drawSeed(c, width * 0.5, groundY + 2, 1.5, sprout);
      drawRobot(c, width * 0.35, groundY, 1.7, { look: 0.7 });
      // excitement lines
      if (sprout > 0.5) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        const cx = width * 0.35;
        const cy = groundY - 60;
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          wobblyLine(ctx, cx, cy, cx + Math.cos(ang) * 22, cy + Math.sin(ang) * 22, 1, 3, rng);
        }
        ctx.restore();
      }
      break;
    }
    case 's14': { // GROWTH
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      drawSky(c);
      const age = 0.2 + shotProgress * 1.8;
      drawTree(c, width * 0.5, groundY, age, age);
      drawRobot(c, width * 0.32, groundY, 1.5 + shotProgress * 0.2, { look: 0.6 });
      break;
    }
    case 's15': { // FOREST
      clearPaper(c);
      drawPaperTexture(c);
      drawGroundLine(c, groundY);
      drawSky(c);
      drawClouds(c, 3);
      // multiple trees
      const trees = 5;
      for (let i = 0; i < trees; i++) {
        const tx = width * 0.15 + (i / (trees - 1)) * width * 0.7 + (rng() - 0.5) * 40;
        const age = 0.8 + rng() * 0.8 + shotProgress * 0.3;
        drawTree(c, tx, groundY + (rng() - 0.5) * 10, age * 0.9, age);
      }
      // old robot, slightly bent
      drawRobot(c, width * 0.5, groundY, 1.6, { sad: 0.2, look: -0.2 });
      // tape label
      drawTape(c, width * 0.5, height * 0.14, 180, -0.06);
      drawLabel(c, 'ГОД 47 • ЛЕС ЖИВЁТ', width * 0.5 - 72, height * 0.14, { size: 12, mono: true });
      break;
    }
    case 's16': { // REST memory
      clearPaper(c, '#fff7e8');
      drawPaperTexture(c, 0.8);
      drawGroundLine(c, groundY);
      drawSky(c, false);
      drawTree(c, width * 0.5, groundY, 1.8, 1.8);
      // robot resting against tree
      drawRobot(c, width * 0.5 + 28, groundY, 1.5, { walk: 0 });
      // shade
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.ellipse(width * 0.5 + 20, groundY + 4, 80, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(c, 'отдых...', width * 0.08, height * 0.85, { size: 14, mono: true, color: 'rgba(0,0,0,0.4)' });
      break;
    }
    case 's17': { // CYCLE blueprint
      clearPaper(c);
      drawGrid(c);
      const cx = width * 0.5;
      const cy = height * 0.48;
      // tree schematic
      ctx.save();
      ctx.translate(cx, cy + 60);
      ctx.strokeStyle = c.film.palette.blueprintInk;
      ctx.lineWidth = 1.5;
      // trunk
      wobblyLine(ctx, 0, 0, 0, -80, 1, 6, rng);
      // canopy circle
      ctx.beginPath();
      ctx.arc(0, -110, 50, 0, Math.PI * 2);
      ctx.stroke();
      // seed flying away
      const flyX = shotProgress * width * 0.6 - width * 0.1;
      const flyY = -110 - shotProgress * 200 + Math.sin(shotProgress * 10) * 20;
      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.arc(flyX, flyY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // dotted trail
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(0, -110);
      ctx.lineTo(flyX, flyY);
      ctx.stroke();
      ctx.restore();
      drawLabel(c, 'CYCLE COMPLETE • SEED DISPERSED', cx - 110, cy + 120, { size: 11, mono: true, color: 'rgba(168,208,255,0.8)' });
      drawLabel(c, '0 → 1 → ∞', cx - 30, cy + 140, { size: 10, mono: true, color: 'rgba(168,208,255,0.5)' });
      break;
    }
  }
}

// === SPORE FILM ===
function drawSporeShot(c: FrameContext) {
  const { width, height, shot, shotProgress, rng } = c;
  const groundY = height * 0.78;
  clearPaper(c);
  if (shot.mode === 'blueprint') drawGrid(c);
  drawPaperTexture(c, shot.mode === 'paper' ? 0.8 : 0.4);
  if (shot.mode !== 'blueprint' && shot.mode !== 'night') drawSky(c, shot.mode === 'paper');
  drawGroundLine(c, groundY);

  const cx = width * 0.5;
  const sporeX = width * 0.15 + shotProgress * width * 0.7 + Math.sin(shotProgress * 6) * 18;
  const sporeY = height * 0.35 + Math.cos(shotProgress * 4) * 30;

  switch (shot.id) {
    case 's1':
      // mushroom
      c.ctx.fillStyle = c.film.palette.ink;
      c.ctx.beginPath();
      c.ctx.ellipse(cx, groundY, 40, 12, 0, 0, Math.PI * 2);
      c.ctx.fill();
      c.ctx.fillStyle = '#a78bfa';
      c.ctx.beginPath();
      c.ctx.arc(cx, groundY - 18, 34, 0, Math.PI);
      c.ctx.fill();
      c.ctx.strokeStyle = c.film.palette.ink;
      c.ctx.lineWidth = 2;
      c.ctx.stroke();
      // spores puff
      for (let i = 0; i < 14; i++) {
        const sx = cx + (rng() - 0.5) * 30 + shotProgress * (rng() * 60);
        const sy = groundY - 30 - shotProgress * (80 + rng() * 80) + Math.sin(i) * 10;
        c.ctx.fillStyle = `rgba(167,139,250,${0.9 - shotProgress * 0.6})`;
        c.ctx.beginPath();
        c.ctx.arc(sx, sy, 2 + rng() * 2, 0, Math.PI * 2);
        c.ctx.fill();
      }
      break;
    default:
      // generic spore travel
      // spore
      c.ctx.save();
      c.ctx.translate(sporeX, sporeY);
      c.ctx.rotate(shotProgress * 2);
      c.ctx.fillStyle = '#a78bfa';
      c.ctx.strokeStyle = c.film.palette.ink;
      c.ctx.lineWidth = 1.5;
      c.ctx.beginPath();
      c.ctx.arc(0, 0, 6 + Math.sin(shotProgress * 10) * 1, 0, Math.PI * 2);
      c.ctx.fill();
      c.ctx.stroke();
      // tail
      c.ctx.strokeStyle = 'rgba(167,139,250,0.4)';
      c.ctx.lineWidth = 1;
      c.ctx.beginPath();
      c.ctx.moveTo(-6, 0);
      c.ctx.lineTo(-18 - rng() * 10, (rng() - 0.5) * 6);
      c.ctx.stroke();
      c.ctx.restore();

      // environment hints based on shot
      if (shot.id === 's2') {
        // city blueprint
        for (let i = 0; i < 8; i++) {
          const bx = (i / 8) * width;
          const bh = 40 + rng() * 80;
          c.ctx.strokeStyle = 'rgba(196,181,253,0.5)';
          c.ctx.strokeRect(bx + 10, groundY - bh, 50, bh);
        }
      }
      if (shot.id === 's6') {
        // rain
        c.ctx.strokeStyle = 'rgba(100,100,255,0.3)';
        for (let i = 0; i < 40; i++) {
          const rx = rng() * width;
          const ry = (rng() * height + shotProgress * 400) % height;
          wobblyLine(c.ctx, rx, ry, rx + 4, ry + 18, 1, 2, rng);
        }
      }
      if (shot.id === 's12' || shot.id === 's13') {
        drawTree(c, cx, groundY, 0.5 + shotProgress * 1.2, 0.5 + shotProgress);
      }
      break;
  }
}

// === SIGNAL FILM ===
function drawSignalShot(c: FrameContext) {
  const { width, height, shot, shotProgress, rng } = c;
  const groundY = height * 0.78;
  clearPaper(c, shot.mode === 'night' ? '#020617' : shot.mode === 'blueprint' ? '#020617' : '#f8fafc');
  if (shot.mode === 'blueprint') drawGrid(c);
  drawPaperTexture(c, 0.4);
  drawSky(c, true);

  const cx = width * 0.5;
  const signalX = width * 0.15 + shotProgress * width * 0.7;
  const signalY = height * 0.4 + Math.sin(shotProgress * 8) * 24;

  switch (shot.id) {
    case 's1':
      // silence - empty
      c.ctx.fillStyle = 'rgba(103,232,249,0.08)';
      c.ctx.beginPath();
      c.ctx.arc(cx, height * 0.4, 120 + Math.sin(shotProgress * 2) * 10, 0, Math.PI * 2);
      c.ctx.fill();
      drawLabel(c, 'NO SIGNAL', cx - 40, height * 0.4, { size: 12, mono: true, color: 'rgba(103,232,249,0.4)' });
      break;
    case 's2':
      // antenna
      c.ctx.strokeStyle = c.film.palette.blueprintInk;
      c.ctx.lineWidth = 2;
      c.ctx.beginPath();
      c.ctx.moveTo(cx, groundY);
      c.ctx.lineTo(cx, groundY - 120);
      c.ctx.stroke();
      // dish
      c.ctx.beginPath();
      c.ctx.arc(cx, groundY - 120, 36, -0.2, Math.PI + 0.2);
      c.ctx.stroke();
      // signal emanating
      c.ctx.strokeStyle = 'rgba(103,232,249,0.6)';
      c.ctx.beginPath();
      c.ctx.arc(cx, groundY - 120, 10 + shotProgress * 80, -0.5, 0.5);
      c.ctx.stroke();
      break;
    default:
      // signal dot traveling
      c.ctx.save();
      c.ctx.translate(signalX, signalY);
      c.ctx.fillStyle = '#22d3ee';
      c.ctx.shadowColor = '#22d3ee';
      c.ctx.shadowBlur = 18;
      c.ctx.beginPath();
      c.ctx.arc(0, 0, 7, 0, Math.PI * 2);
      c.ctx.fill();
      c.ctx.shadowBlur = 0;
      // trail
      c.ctx.strokeStyle = 'rgba(34,211,238,0.3)';
      c.ctx.lineWidth = 2;
      c.ctx.beginPath();
      c.ctx.moveTo(0, 0);
      c.ctx.lineTo(-40 - shotProgress * 20, 0);
      c.ctx.stroke();
      c.ctx.restore();

      // debris satellites
      for (let i = 0; i < 4; i++) {
        const sx = (rng() * width + shotProgress * 100) % width;
        const sy = rng() * height * 0.6 + 60;
        c.ctx.strokeStyle = shot.mode === 'blueprint' ? 'rgba(103,232,249,0.25)' : 'rgba(15,23,42,0.15)';
        c.ctx.strokeRect(sx - 12, sy - 6, 24, 12);
        c.ctx.beginPath();
        c.ctx.moveTo(sx - 20, sy);
        c.ctx.lineTo(sx - 12, sy);
        c.ctx.moveTo(sx + 12, sy);
        c.ctx.lineTo(sx + 20, sy);
        c.ctx.stroke();
      }

      if (shot.id === 's13' || shot.id === 's14') {
        // receiver dish lighting up
        const rx = width * 0.7;
        const ry = groundY - 60;
        c.ctx.strokeStyle = '#22d3ee';
        c.ctx.lineWidth = shotProgress > 0.5 ? 3 : 1.5;
        c.ctx.beginPath();
        c.ctx.arc(rx, ry, 30, 0, Math.PI * 2);
        c.ctx.stroke();
        if (shotProgress > 0.5) {
          c.ctx.fillStyle = 'rgba(34,211,238,0.25)';
          c.ctx.beginPath();
          c.ctx.arc(rx, ry, 30, 0, Math.PI * 2);
          c.ctx.fill();
        }
      }
      break;
  }
}

export function drawShot(c: FrameContext) {
  // pre
  clearPaper(c);
  if (c.shot.mode === 'blueprint') drawGrid(c);
  drawPaperTexture(c, c.shot.mode === 'paper' ? 0.85 : 0.45);

  // dispatch
  if (c.film.id === 'robot') drawRobotShot(c);
  else if (c.film.id === 'spore') drawSporeShot(c);
  else if (c.film.id === 'signal') drawSignalShot(c);
  else {
    // generic fallback - robot
    drawRobotShot(c);
  }

  // post
  vignette(c, c.shot.mode === 'night' ? 0.45 : 0.22);

  // shot number + title tape for paper mode occasionally
  if (c.shot.mode === 'paper' && c.shotProgress < 0.25) {
    const alpha = 1 - c.shotProgress / 0.25;
    c.ctx.save();
    c.ctx.globalAlpha = alpha;
    drawTape(c, c.width * 0.5, c.height * 0.09, 220, -0.04);
    drawLabel(c, `${String(c.shotIndex + 1).padStart(2, '0')} • ${c.shot.titleRu}`, c.width * 0.5 - 88, c.height * 0.09, { size: 11, mono: true });
    c.ctx.restore();
  }

  // film border for blueprint
  if (c.shot.mode === 'blueprint') {
    c.ctx.save();
    c.ctx.strokeStyle = 'rgba(168,208,255,0.18)';
    c.ctx.lineWidth = 2;
    c.ctx.strokeRect(12, 12, c.width - 24, c.height - 24);
    // corner marks
    const marks = [[12, 12], [c.width - 12, 12], [12, c.height - 12], [c.width - 12, c.height - 12]];
    c.ctx.fillStyle = 'rgba(168,208,255,0.5)';
    marks.forEach(([x, y]) => {
      c.ctx.beginPath();
      c.ctx.arc(x, y, 3, 0, Math.PI * 2);
      c.ctx.fill();
    });
    c.ctx.restore();
  }
}
