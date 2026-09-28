import * as THREE from 'three';
import { SKIBIDI_TYPES, SkibidiType } from '../skibidi/types';
import { Film3DSpec, Film3DShot } from './filmSpec';
import { skibidiFilm3D } from './filmSpec';

function makeCanvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpV3(a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  out.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
}

export class Film3DRenderer {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  film: Film3DSpec;
  time = 0;
  duration: number;
  isPlaying = false;
  private raf = 0;
  private last = 0;
  private clock = new THREE.Clock();
  private onTime?: (t: number, shotIdx: number) => void;
  private shotIdx = 0;
  private characters: THREE.Group[] = [];
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; max: number }[] = [];
  private mouthAnims: Map<THREE.Group, { mouth: THREE.Mesh; head: THREE.Mesh; baseY: number; wobble: number }> = new Map();
  private smoothMouth = 0;
  bpm: number;

  constructor(canvas: HTMLCanvasElement, film: Film3DSpec = skibidiFilm3D, onTime?: (t: number, shotIdx: number) => void) {
    this.canvas = canvas;
    this.film = film;
    this.duration = film.shots.reduce((a, s) => a + s.duration, 0);
    this.bpm = film.bpm;
    this.onTime = onTime;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);
    this.scene.fog = new THREE.Fog(0x020617, 18, 95);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.rotation.order = 'YXZ';

    this.buildWorld();
    this.renderFrame(0);
  }

  private buildWorld() {
    // lights
    const hemi = new THREE.HemisphereLight(0x8ecfff, 0x1a1a2e, 0.65);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0d0, 1.5);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
    sun.shadow.camera.far = 140;
    this.scene.add(sun);

    const moon = new THREE.DirectionalLight(0x7aa2ff, 0.5);
    moon.position.set(-40, 40, -30);
    this.scene.add(moon);

    // ground
    const groundTex = makeCanvasTexture(512, 512, g => {
      g.fillStyle = '#0f172a'; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) {
        g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke();
        g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke();
      }
      g.fillStyle = '#facc15'; g.fillRect(0, 240, 512, 6);
      g.fillStyle = '#fff';
      for (let i = 0; i < 512; i += 64) g.fillRect(i, 300, 28, 5);
    });
    groundTex.repeat.set(12, 12);
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // buildings
    const rng = (seed: number) => {
      return () => {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ seed >>> 15, seed | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    };
    const r = rng(123);
    for (let i = 0; i < 26; i++) {
      const bw = 4 + r() * 7;
      const bd = 4 + r() * 7;
      const bh = 7 + r() * 20;
      const bx = (r() - 0.5) * 90;
      const bz = (r() - 0.5) * 90;
      if (Math.hypot(bx, bz) < 14) continue;
      const winTex = makeCanvasTexture(256, 512, g => {
        g.fillStyle = '#0f172a'; g.fillRect(0, 0, 256, 512);
        for (let wy = 12; wy < 500; wy += 28) {
          for (let wx = 12; wx < 244; wx += 22) {
            if (r() > 0.35) {
              g.fillStyle = r() > 0.3 ? '#fde68a' : '#1e293b';
              g.fillRect(wx, wy, 12, 16);
            }
          }
        }
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.8 }));
      mesh.position.set(bx, bh / 2, bz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    // moon
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 24), new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfacc15, emissiveIntensity: 0.3 }));
    moonMesh.position.set(60, 55, -50);
    this.scene.add(moonMesh);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      starPos[i * 3] = (r() - 0.5) * 400;
      starPos[i * 3 + 1] = 30 + r() * 120;
      starPos[i * 3 + 2] = (r() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 })));
  }

  private getTypeById(id: string): SkibidiType {
    return SKIBIDI_TYPES.find(t => t.id === id) || SKIBIDI_TYPES[0];
  }

  private createToiletModel(type: SkibidiType, seed: number): THREE.Group {
    const group = new THREE.Group();
    // bowl lathe
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const y = -0.55 + t * 1.1;
      const rad = 0.5 + Math.sin(t * Math.PI) * 0.22 + t * 0.12;
      pts.push(new THREE.Vector2(rad, y));
    }
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), new THREE.MeshStandardMaterial({ color: type.isAstro ? 0x0f172a : 0xffffff, roughness: 0.25, metalness: type.isAstro ? 0.4 : 0.05 }));
    bowl.castShadow = true;
    group.add(bowl);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.1, 10, 20), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.58;
    group.add(rim);

    const water = new THREE.Mesh(new THREE.CircleGeometry(0.46, 16), new THREE.MeshStandardMaterial({ color: type.id === 'lemon' ? 0xfacc15 : 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.25, roughness: 0.1 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.54;
    group.add(water);

    // head
    const headTex = makeCanvasTexture(256, 256, g => {
      g.fillStyle = type.isZombie ? '#bbf7d0' : '#ffdbac';
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#fff';
      g.beginPath();
      g.ellipse(80, 110, 26, 30, 0, 0, Math.PI * 2);
      g.ellipse(176, 110, 26, 30, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = type.isZombie ? '#22c55e' : '#3b82f6';
      g.beginPath(); g.arc(80, 116, 12, 0, Math.PI * 2); g.arc(176, 116, 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#000';
      g.beginPath(); g.arc(80, 116, 6, 0, Math.PI * 2); g.arc(176, 116, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7f1d1d';
      g.beginPath(); g.ellipse(128, 190, 32, 18, 0, 0, Math.PI * 2); g.fill();
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 20), new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.6 }));
    head.position.y = 1.02;
    head.castShadow = true;
    group.add(head);

    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), new THREE.MeshStandardMaterial({ color: 0x7f1d1d }));
    mouth.position.set(0, 0.86, 0.3);
    mouth.scale.set(1.2, 0.6, 0.5);
    group.add(mouth);

    if (type.isAstro) {
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), new THREE.MeshStandardMaterial({ color: type.accent as any, transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.8 }));
      helm.position.y = 1.06;
      group.add(helm);
    }

    const scaleMap: Record<string, number> = { small: 0.7, normal: 1, large: 1.35, 'astro-carrier': 2.6, 'astro-mothership': 4.2, 'titan-cameraman': 2.4, 'titan-speakerman': 2.4, 'titan-tvman': 2.4, golden: 1.8 };
    group.scale.setScalar(scaleMap[type.id] || 1);

    // store anim refs
    this.mouthAnims.set(group, { mouth, head, baseY: 1.02, wobble: Math.random() * 10 });

    return group;
  }

  private clearCharacters() {
    this.characters.forEach(c => this.scene.remove(c));
    this.characters = [];
    this.mouthAnims.clear();
  }

  private spawnForShot(shot: Film3DShot) {
    this.clearCharacters();
    shot.spawn.forEach((typeId, idx) => {
      const type = this.getTypeById(typeId);
      const model = this.createToiletModel(type, idx * 999 + this.shotIdx * 100);
      // position in circle or line
      const count = shot.spawn.length;
      if (count === 1) {
        model.position.set(0, 0, 0);
      } else {
        const ang = (idx / count) * Math.PI * 2;
        const rad = count > 4 ? 3.5 : 2.2;
        model.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      }
      // special positions for mothership high in sky
      if (typeId === 'astro-mothership') {
        model.position.set(0, 18, -30);
      }
      if (typeId === 'astro-carrier') {
        model.position.set(0, 8, -12);
      }
      this.scene.add(model);
      this.characters.push(model);
    });
  }

  private getShotAt(t: number): { shot: Film3DShot; idx: number; progress: number; shotTime: number } {
    let acc = 0;
    for (let i = 0; i < this.film.shots.length; i++) {
      const s = this.film.shots[i];
      if (t >= acc && t < acc + s.duration) {
        return { shot: s, idx: i, progress: (t - acc) / s.duration, shotTime: t - acc };
      }
      acc += s.duration;
    }
    const last = this.film.shots[this.film.shots.length - 1];
    return { shot: last, idx: this.film.shots.length - 1, progress: 1, shotTime: last.duration };
  }

  private getMouthOpen(t: number): number {
    const beatDur = 60 / this.bpm;
    const beat = (t / (beatDur / 2)) % 16;
    let target = 0.15;
    const b = Math.floor(beat);
    if (b === 0) target = 0.9;
    else if (b === 2 || b === 3) target = 0.65;
    else if (b === 4 || b === 5) target = 0.85;
    else if (b === 6 || b === 7) target = 1.0;
    else if (b === 8) target = 0.9;
    else if (b === 12) target = 0.8;
    else if (b === 14) target = 0.95;
    const diff = target - this.smoothMouth;
    this.smoothMouth += diff * 0.32;
    return this.smoothMouth;
  }

  renderFrame(t: number) {
    this.time = t;
    const { shot, idx, progress } = this.getShotAt(t);
    if (idx !== this.shotIdx) {
      this.shotIdx = idx;
      this.spawnForShot(shot);
    }

    // camera interpolation
    const camStartPos = new THREE.Vector3(...shot.camStart.pos);
    const camEndPos = new THREE.Vector3(...shot.camEnd.pos);
    const camStartLook = new THREE.Vector3(...shot.camStart.look);
    const camEndLook = new THREE.Vector3(...shot.camEnd.look);
    const curPos = new THREE.Vector3();
    const curLook = new THREE.Vector3();
    // smoothstep
    const smooth = progress * progress * (3 - 2 * progress);
    lerpV3(camStartPos, camEndPos, smooth, curPos);
    lerpV3(camStartLook, camEndLook, smooth, curLook);
    this.camera.position.copy(curPos);
    this.camera.lookAt(curLook);
    const fov = lerp(shot.camStart.fov || 70, shot.camEnd.fov || 70, smooth);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();

    // animate characters
    const mouthOpen = this.getMouthOpen(t);
    this.characters.forEach((c, i) => {
      const anim = this.mouthAnims.get(c);
      if (!anim) return;
      anim.wobble += 0.02;
      c.position.y = Math.sin(anim.wobble) * 0.06;
      c.rotation.y += 0.005 + i * 0.001;
      anim.mouth.scale.set(1.2 + mouthOpen * 0.7, 0.6 + mouthOpen * 1.1, 0.5);
      anim.head.rotation.x = Math.sin(t * 5 + i) * 0.12;
      // marching for shot 3
      if (shot.id === 's3') {
        c.position.z -= 0.03;
        if (c.position.z < -12) c.position.z = 12;
      }
      // warp scale for astro
      if (shot.id === 's5' && progress < 0.5) {
        const sc = progress / 0.5;
        c.scale.setScalar((c.scale.x * sc));
      }
    });

    // update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += 0.016;
      if (p.life >= p.max) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.add(p.vel.clone().multiplyScalar(0.016));
      p.vel.y -= 0.08;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - p.life / p.max;
    }

    // render
    this.renderer.render(this.scene, this.camera);
    this.onTime?.(t, idx);
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.clock.start();
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.isPlaying) return;
      const dt = Math.min((now - this.last) / 1000, 0.033);
      this.last = now;
      this.time += dt;
      if (this.time >= this.duration) {
        this.time = 0;
        this.shotIdx = -1;
      }
      this.renderFrame(this.time);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.isPlaying = false;
    cancelAnimationFrame(this.raf);
  }

  seek(t: number) {
    this.time = Math.max(0, Math.min(this.duration, t));
    this.shotIdx = -1; // force respawn
    this.renderFrame(this.time);
  }

  dispose() {
    this.pause();
    this.renderer.dispose();
  }

  exportWebM(onProgress?: (p: number) => void): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = this.canvas.captureStream(30);
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      rec.onerror = e => reject(e);
      rec.start(100);
      let t = 0;
      const dur = this.duration;
      const step = () => {
        if (t >= dur) { rec.stop(); return; }
        this.renderFrame(t);
        onProgress?.(t / dur);
        t += 1 / 30;
        setTimeout(step, 1000 / 30 / 3);
      };
      step();
    });
  }
}
