#!/usr/bin/env node
// Optional browser regression test. Start serve_body51_day.py first.
// npm i --prefix /tmp/body51-deps playwright @sparticuz/chromium
// BODY51_DEPS=/tmp/body51-deps/node_modules node film/tools/check_body51_day_browser.mjs
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {requireDeps, timeline} from './body51_day_common.mjs';
const data = timeline();

const {chromium} = requireDeps('playwright');
let executablePath = process.env.BROWSER_BIN, args = ['--no-sandbox'];
if (!executablePath) {
  const runtime = requireDeps('@sparticuz/chromium');
  const build = runtime.default || runtime;
  // The portable npm build carries these libraries; no system installation or
  // network fetch is needed even in a minimal container without libnss/libnspr.
  const bin = path.resolve(path.dirname(requireDeps.resolve('@sparticuz/chromium')), '../bin');
  if (runtime.inflate && runtime.setupLambdaEnvironment && fs.existsSync(path.join(bin, 'al2023.tar.br'))) {
    await runtime.inflate(path.join(bin, 'al2023.tar.br'));
    runtime.setupLambdaEnvironment(path.join(os.tmpdir(), 'al2023/lib'));
  }
  executablePath = await build.executablePath(); args = build.args;
}
const base = process.env.BODY51_PREVIEW || 'http://127.0.0.1:8080';
const browser = await chromium.launch({headless: true, executablePath, args});
const errors = [];
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 960}});
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(base);
  await page.waitForFunction(() => window.__body51DayPlayer);
  assert(page.url().includes('/film/body51-min.html'));
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
  assert(Math.abs(await page.locator('video').evaluate(v => v.duration) - data.total) < .03);
  assert.equal(await page.locator('.chapter').count(), data.scenes.length);
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('video').currentTime > .3);
  await page.locator('#toggle').click();
  assert(await page.locator('video').evaluate(v => v.paused));
  await page.locator('#mute').click();
  assert(await page.locator('video').evaluate(v => v.muted));
  await page.locator('#mute').click();
  await page.locator('.chapter').nth(3).click();
  await page.waitForFunction(t => document.querySelector('video').currentTime >= t, data.scenes[3].start);
  assert.equal(await page.locator('.chapter.active').count(), 1);
  await page.waitForFunction(() => document.querySelectorAll('.chapter')[3].getAttribute('aria-current') === 'true');
  assert.match(await page.locator('.chapter.active').textContent(), /турничок/);
  await page.locator('#toggle').click();
  await page.locator('#seek').fill('43');
  await page.waitForFunction(() => Math.abs(document.querySelector('video').currentTime - 43) < .1);
  await page.locator('h1').click();
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => Math.abs(document.querySelector('video').currentTime - 38) < .1);
  await page.keyboard.press('Digit7');
  await page.waitForFunction(t => Math.abs(document.querySelector('video').currentTime - t) < .1, data.scenes[6].start);
  for (const id of ['hellfarmer', 'inspector', 'meridian']) {
    const i = data.scenes.findIndex(s => s.id === id);
    if (i >= 0) {
      await page.locator('.chapter').nth(i).click();
      await page.waitForFunction(t => Math.abs(document.querySelector('video').currentTime - t) < .6, data.scenes[i].start);
      await page.locator('#toggle').click();
      await page.waitForFunction(i => document.querySelectorAll('.chapter')[i].getAttribute('aria-current') === 'true', i);
      assert.match(await page.locator('.chapter.active').textContent(), new RegExp(data.scenes[i].chapterLabel));
    }
  }
  await page.locator('#fullscreen').click();
  await page.waitForFunction(() => document.fullscreenElement?.id === 'player');
  assert.equal(await page.evaluate(() => document.fullscreenElement?.id), 'player');
  const fullscreenFit = await page.locator('#video').evaluate(v => { const r = v.getBoundingClientRect(); return r.width <= innerWidth && r.height <= innerHeight; });
  assert(fullscreenFit);
  await page.locator('#fullscreen').click();
  await page.waitForFunction(() => document.fullscreenElement === null);
  assert.equal(await page.evaluate(() => document.fullscreenElement), null);
  console.log('✓ MP4 play/pause, sound, chapters, seek, keyboard, enter/exit fullscreen');

  for (const [width, height] of [[1440, 960], [768, 1024], [390, 844], [320, 568]]) {
    await page.setViewportSize({width, height});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: horizontal overflow`);
    const r = await page.locator('#video').boundingBox();
    assert(r.x >= 0 && r.x + r.width <= width + 1 && r.y >= 0 && r.y + r.height <= height, `${width}: cropped video`);
    assert(Math.abs(r.width / r.height - 9 / 16) < .001, `${width}: distorted aspect`);
    console.log(`✓ ${width}×${height}: video fits, 9:16, no horizontal overflow`);
  }
  await page.evaluate(t => window.__body51DayPlayer.jump(t - .22), data.total);
  await page.locator('#toggle').click();
  await page.waitForFunction(() => document.querySelector('video').ended);
  assert(await page.locator('#start').isVisible());
  await page.locator('#start').click();
  await page.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').currentTime < 1);
  console.log('✓ End card and replay');

  await page.goto(base + '/film/body51-min.html?live=1&t=29');
  await page.waitForFunction(() => window.__body51DayPlayer?.movie);
  await page.waitForFunction(() => document.getElementById('live-audio').currentTime >= 29);
  assert(await page.locator('#live-canvas').isVisible());
  assert(await page.locator('#video').isHidden());
  const deterministic = await page.evaluate(() => {
    const {movie} = window.__body51DayPlayer, cv = document.getElementById('live-canvas');
    movie.draw(29); const a = cv.toDataURL(); movie.draw(52); movie.draw(29); return cv.toDataURL() === a;
  });
  assert(deterministic);
  if (data.presentation?.cleanFrame) {
    const pose = await page.evaluate(() => {
      const {movie} = window.__body51DayPlayer;
      const a = movie.draw(.5), b = movie.draw(7.5);
      return {angle:a.action.bedPose.angle, lying:a.action.bedPose.phase, standing:b.action.bedPose.phase, text:[...a.drawnText,...b.drawnText]};
    });
    assert.equal(pose.lying, 'lying'); assert.equal(pose.standing, 'standing');
    assert(Math.abs(pose.angle + Math.PI/2) < .001);
    assert(pose.text.every(s => !/@body51|ЗА КАДРОМ|ПО СТРИМАМ|#\d{3}/i.test(s)));
    console.log('✓ Browser bed poses and clean frame: no watermarks or source overlays');
  }
  if(['day-5','day-6'].includes(data.version)) {
    const story = await page.evaluate(()=>{
      const {movie,data}=window.__body51DayPlayer,s=data.scenes[0];
      const samples=[s.events.swat-.03,s.events.swat+.12,(s.events.pillow+s.events.rebound)/2,(s.events.rebound+s.events.catch)/2,s.events.catch+.5];
      const phases=samples.map(t=>movie.draw(s.start+t).action.bedPose.catPhase);
      const h=data.scenes.find(s=>s.id==='hellfarmer');
      return {phases,gear:movie.draw(h.start+h.duration-.4).drawnText,sceneIds:data.scenes.map(s=>s.id)};
    });
    assert.deepEqual(story.phases,['waiting','outbound','pillow','returning','caught']);
    assert(!story.sceneIds.includes('printers'));
    assert(story.gear.some(t=>t==='ПРИМЕРОЧНАЯ'));
    assert(story.gear.every(t=>!/автобой|принтер/i.test(t)));
    console.log('✓ Browser: swat / soft rebound / catch, ten chapters, new Hellfarmer gear gag');
  }
  if(data.version==='day-6') {
    const acting=await page.evaluate(()=>{
      const {movie,data}=window.__body51DayPlayer,w=data.scenes[0],f=data.scenes.at(-1);
      const close=movie.draw(w.events.catch+.6);
      const high=movie.draw(f.start+f.events.catLaunch-.05).action.pullup;
      const low=movie.draw(f.start+f.events.catPerch+.8).action.pullup;
      return {shot:close.shot.name,zoom:close.shot.zoom,faces:close.focusBoxes.filter(b=>b.name==='Лицо Артёма'),high,low};
    });
    assert.equal(acting.shot,'wake-reaction');assert(acting.zoom>2.9);assert(acting.faces.length);
    assert(acting.high.noseY<acting.high.barY);assert(acting.low.noseY>acting.low.barY+200);
    console.log('✓ Directed portrait composition, facial close-up, pull-up anticipation and weighted drop');
  }
  await page.locator('#toggle').click();
  await page.waitForFunction(() => document.getElementById('live-audio').currentTime > 29.2);
  await page.locator('#toggle').click();
  assert(await page.locator('#live-audio').evaluate(a => a.paused));
  console.log('✓ Live Canvas: embedded fonts, deterministic seek, shared soundtrack, play/pause');

  const response = await fetch(base + '/film/body51-min.mp4', {headers: {Range: 'bytes=1000-1999'}});
  assert.equal(response.status, 206); assert.equal((await response.arrayBuffer()).byteLength, 1000);
  const suffix = await fetch(base + '/film/body51-min.mp4', {headers: {Range: 'bytes=-128'}});
  assert.equal(suffix.status, 206); assert.equal((await suffix.arrayBuffer()).byteLength, 128);
  const invalid = await fetch(base + '/film/body51-min.mp4', {headers: {Range: 'bytes=99999999999-'}});
  assert.equal(invalid.status, 416);
  const host = await fetch(base + '/film/body51-min.html', {headers: {Host: 'preview.e2b.app'}});
  assert.equal(host.status, 200);
  assert.deepEqual(errors, []);
  console.log('✓ Range seeking, suffix ranges, invalid ranges, preview host, no page/resource errors');
} finally { await browser.close(); }
