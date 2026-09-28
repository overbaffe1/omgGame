import * as THREE from 'three';
import { SKIBIDI_TYPES, SkibidiType } from '../skibidi/types';
import { Enemy3D, Projectile, Particle, Hud3D, GamePhase3D } from './types';
import { SkibidiAudio } from '../skibidi/audio';

const MAP = 48;
const KILLS_TO_WIN = 50;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, seed | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function makeCanvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return { canvas: c, tex, ctx: g };
}

export class Skibidi3DGame {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock = new THREE.Clock();
  raf = 0;
  disposed = false;
  audio = new SkibidiAudio();

  // player
  playerPos = new THREE.Vector3(0, 1.7, 18);
  playerVel = new THREE.Vector3();
  vy = 0;
  yaw = 0;
  pitch = 0;
  hp = 100;
  maxHp = 100;
  score = 0;
  wave = 0;
  time = 0;
  keys = new Set<string>();
  firing = false;
  lastShot = 0;
  shake = 0;
  hurtFlash = 0;
  hitFlash = 0;

  // world
  enemies: Enemy3D[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  colliders: { minX: number; maxX: number; minZ: number; maxZ: number; h: number }[] = [];
  spawnQueue: SkibidiType[] = [];
  spawnTimer = 0;
  intermission = 2.5;
  phase: GamePhase3D = 'menu';
  running = false;
  cinematicTime = 0;

  // three helpers
  private weapon!: THREE.Group;
  private muzzle!: THREE.Object3D;
  private muzzleFlash!: THREE.Mesh;
  private muzzleLight!: THREE.PointLight;
  private crosshair!: THREE.Group;
  private ground!: THREE.Mesh;
  private buildings: THREE.Mesh[] = [];

  // callbacks
  private onHud: (h: Hud3D) => void;
  private onPhase: (p: GamePhase3D, data?: any) => void;
  private onFeed: (t: string, k: 'kill' | 'info' | 'bad') => void;

  constructor(canvas: HTMLCanvasElement, cbs: { onHud: (h: Hud3D) => void; onPhase: (p: GamePhase3D, d?: any) => void; onFeed: (t: string, k: any) => void }) {
    this.canvas = canvas;
    this.onHud = cbs.onHud;
    this.onPhase = cbs.onPhase;
    this.onFeed = cbs.onFeed;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);
    this.scene.fog = new THREE.Fog(0x020617, 22, 110);

    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 240);
    this.camera.rotation.order = 'YXZ';

    this.init();
  }

  private init() {
    // lights
    const hemi = new THREE.HemisphereLight(0x8ecfff, 0x1a1a2e, 0.7);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
    sun.shadow.camera.far = 140;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);

    const moon = new THREE.DirectionalLight(0x7aa2ff, 0.6);
    moon.position.set(-40, 40, -30);
    this.scene.add(moon);

    // point lights for city
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.PointLight(0xffc46b, 30, 32, 1.8);
      pl.position.set((Math.random() - 0.5) * 80, 6, (Math.random() - 0.5) * 80);
      this.scene.add(pl);
    }

    this.buildWorld();
    this.buildWeapon();
    this.buildCrosshair();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onLockChange);
  }

  private buildWorld() {
    const r = rng(42);

    // ground with HQ texture
    const { tex: groundTex } = makeCanvasTexture(512, 512, g => {
      g.fillStyle = '#0f172a'; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) {
        g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke();
        g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke();
      }
      // road markings
      g.fillStyle = '#facc15';
      g.fillRect(0, 240, 512, 8);
      g.fillStyle = '#fff';
      for (let i = 0; i < 512; i += 64) g.fillRect(i, 300, 32, 6);
    });
    groundTex.repeat.set(12, 12);
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP * 2 + 40, MAP * 2 + 40),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.85, metalness: 0.1 })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // buildings - HQ with window textures
    const buildCount = 28;
    for (let i = 0; i < buildCount; i++) {
      const bw = 4 + r() * 7;
      const bd = 4 + r() * 7;
      const bh = 6 + r() * 22;
      const bx = (r() - 0.5) * (MAP * 2 - 10);
      const bz = (r() - 0.5) * (MAP * 2 - 10);
      if (Math.hypot(bx, bz) < 12) continue;

      const { tex } = makeCanvasTexture(256, 512, g => {
        g.fillStyle = '#0f172a'; g.fillRect(0, 0, 256, 512);
        g.fillStyle = '#1e293b'; g.fillRect(0, 0, 256, 512);
        // windows grid
        for (let wy = 12; wy < 500; wy += 28) {
          for (let wx = 12; wx < 244; wx += 22) {
            if (r() > 0.35) {
              g.fillStyle = r() > 0.3 ? '#fde68a' : '#1e293b';
              g.fillRect(wx, wy, 12, 16);
              if (r() > 0.5) {
                g.fillStyle = 'rgba(255,255,255,0.4)';
                g.fillRect(wx, wy, 12, 2);
              }
            }
          }
        }
      });

      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.1 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
      mesh.position.set(bx, bh / 2, bz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.buildings.push(mesh);
      this.colliders.push({ minX: bx - bw / 2 - 0.4, maxX: bx + bw / 2 + 0.4, minZ: bz - bd / 2 - 0.4, maxZ: bz + bd / 2 + 0.4, h: bh });
    }

    // bathroom zone - center
    const { tex: tileTex } = makeCanvasTexture(256, 256, g => {
      g.fillStyle = '#f8fafc'; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = '#cbd5e1'; g.lineWidth = 3;
      g.strokeRect(0, 0, 256, 256);
      g.fillStyle = 'rgba(0,0,0,0.02)';
      g.beginPath(); g.arc(128, 128, 80, 0, Math.PI * 2); g.fill();
    });
    tileTex.repeat.set(8, 8);
    const bathroom = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.3, metalness: 0.05 })
    );
    bathroom.rotation.x = -Math.PI / 2;
    bathroom.position.set(0, 0.02, 0);
    bathroom.receiveShadow = true;
    this.scene.add(bathroom);

    // walls for bathroom
    const wallMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.5 });
    const walls = [
      { p: [0, 2, -11], s: [22, 4, 0.6] },
      { p: [0, 2, 11], s: [22, 4, 0.6] },
      { p: [-11, 2, 0], s: [0.6, 4, 22] },
      { p: [11, 2, 0], s: [0.6, 4, 22] },
    ] as const;
    walls.forEach(w => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w.s[0], w.s[1], w.s[2]), wallMat);
      m.position.set(w.p[0], w.p[1], w.p[2]);
      m.receiveShadow = true;
      this.scene.add(m);
    });

    // toilets in bathroom (static props)
    for (let i = 0; i < 4; i++) {
      const tx = -8 + i * 5.5;
      const tz = -8;
      const toiletProp = this.createToiletProp(tx, tz);
      this.scene.add(toiletProp);
    }

    // moon
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(6, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfacc15, emissiveIntensity: 0.25, roughness: 0.8 })
    );
    moonMesh.position.set(70, 60, -60);
    this.scene.add(moonMesh);
    const moonLight = new THREE.PointLight(0xfef3c7, 80, 120, 2);
    moonLight.position.copy(moonMesh.position);
    this.scene.add(moonLight);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      starPos[i * 3] = (r() - 0.5) * 400;
      starPos[i * 3 + 1] = 30 + r() * 120;
      starPos[i * 3 + 2] = (r() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, transparent: true, opacity: 0.9 }));
    this.scene.add(stars);
  }

  private createToiletProp(x: number, z: number) {
    const g = new THREE.Group();
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.9, 0.9, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.05 })
    );
    bowl.position.y = 0.45;
    bowl.castShadow = true;
    g.add(bowl);
    const tank = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.7, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
    );
    tank.position.set(0, 1, -0.5);
    tank.castShadow = true;
    g.add(tank);
    g.position.set(x, 0, z);
    this.colliders.push({ minX: x - 0.7, maxX: x + 0.7, minZ: z - 0.7, maxZ: z + 0.7, h: 1.2 });
    return g;
  }

  private buildWeapon() {
    this.weapon = new THREE.Group();
    const matPlunger = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const matWood = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.3, metalness: 0.6 });

    // handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 12), matWood);
    handle.position.set(0, 0, -0.3);
    handle.rotation.x = Math.PI / 2;
    this.weapon.add(handle);

    // plunger cup
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.12, 20), matPlunger);
    cup.position.set(0, 0, -0.78);
    cup.rotation.x = Math.PI / 2;
    this.weapon.add(cup);

    // camera body
    const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.14), matMetal);
    camBody.position.set(0, 0.12, -0.15);
    this.weapon.add(camBody);

    // lens
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.8 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0.12, -0.24);
    this.weapon.add(lens);

    this.weapon.position.set(0.35, -0.28, -0.55);
    this.camera.add(this.weapon);

    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0, -0.9);
    this.weapon.add(this.muzzle);

    this.muzzleLight = new THREE.PointLight(0x38bdf8, 0, 8, 2);
    this.camera.add(this.muzzleLight);

    this.muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0 })
    );
    this.muzzleFlash.position.set(0, 0, -0.95);
    this.weapon.add(this.muzzleFlash);
  }

  private buildCrosshair() {
    this.crosshair = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const mk = (w: number, h: number, x: number, y: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, -1.5);
      return m;
    };
    this.crosshair.add(mk(0.012, 0.04, 0, 0.03));
    this.crosshair.add(mk(0.012, 0.04, 0, -0.03));
    this.crosshair.add(mk(0.04, 0.012, 0.03, 0));
    this.crosshair.add(mk(0.04, 0.012, -0.03, 0));
    this.crosshair.add(new THREE.Mesh(new THREE.RingGeometry(0.02, 0.022, 24), mat));
    this.camera.add(this.crosshair);
  }

  // --- MODELS ---

  private createFaceTexture(type: SkibidiType, mouthOpen = 0.5) {
    const { tex } = makeCanvasTexture(256, 256, g => {
      // skin
      const grad = g.createRadialGradient(128, 120, 20, 128, 128, 120);
      if (type.isZombie) {
        grad.addColorStop(0, '#bbf7d0'); grad.addColorStop(1, '#16a34a');
      } else if (type.isAstro) {
        grad.addColorStop(0, '#e0e7ff'); grad.addColorStop(1, '#a5b4fc');
      } else if (type.id === 'lemon') {
        grad.addColorStop(0, '#fef08a'); grad.addColorStop(1, '#eab308');
      } else {
        grad.addColorStop(0, '#ffedd5'); grad.addColorStop(1, '#fdba74');
      }
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);

      // eyes
      g.fillStyle = '#fff';
      g.beginPath();
      g.ellipse(80, 110, 28, 32, 0, 0, Math.PI * 2);
      g.ellipse(176, 110, 28, 32, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke();

      const iris = type.isZombie ? '#22c55e' : type.isAstro ? type.accent : '#3b82f6';
      g.fillStyle = iris;
      g.beginPath(); g.arc(80, 118, 14, 0, Math.PI * 2); g.arc(176, 118, 14, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#000';
      g.beginPath(); g.arc(80, 118, 7, 0, Math.PI * 2); g.arc(176, 118, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(76, 112, 4, 0, Math.PI * 2); g.arc(172, 112, 4, 0, Math.PI * 2); g.fill();

      // mouth - singing
      g.fillStyle = '#7f1d1d';
      const mw = 40 + mouthOpen * 30;
      const mh = 18 + mouthOpen * 50;
      g.beginPath();
      g.ellipse(128, 190, mw, mh, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#450a0a';
      g.beginPath();
      g.ellipse(128, 195, mw * 0.7, mh * 0.6, 0, 0, Math.PI * 2);
      g.fill();
      if (mouthOpen > 0.3) {
        g.fillStyle = '#f87171';
        g.beginPath();
        g.ellipse(128, 200, mw * 0.35, 6, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#fff';
        g.fillRect(128 - mw * 0.5, 178, mw, 4);
      }

      // eyebrows angry for skibidi
      g.strokeStyle = '#000'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(48, 78); g.lineTo(108, 92); g.stroke();
      g.beginPath(); g.moveTo(208, 78); g.lineTo(148, 92); g.stroke();

      if (type.id === 'lemon') {
        g.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 20; i++) {
          g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 2, 0, Math.PI * 2); g.fill();
        }
      }
    });
    return tex;
  }

  private createSkibidiModel(type: SkibidiType, seed: number): { group: THREE.Group; head: THREE.Mesh; mouth: THREE.Mesh; eyes: THREE.Mesh[] } {
    const group = new THREE.Group();
    const r = rng(seed);

    // toilet bowl - lathe for HQ
    const points: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = -0.6 + t * 1.2;
      const rad = 0.55 + Math.sin(t * Math.PI) * 0.25 + t * 0.15;
      points.push(new THREE.Vector2(rad, y));
    }
    const bowlGeo = new THREE.LatheGeometry(points, 24);
    const bowlMat = new THREE.MeshStandardMaterial({
      color: type.isAstro ? 0x0f172a : type.isZombie ? 0x052e16 : 0xffffff,
      roughness: type.isAstro ? 0.4 : 0.25,
      metalness: type.isAstro ? 0.5 : 0.05,
    });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    group.add(bowl);

    // rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.11, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.62;
    rim.castShadow = true;
    group.add(rim);

    // water
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 20),
      new THREE.MeshStandardMaterial({
        color: type.isZombie ? 0x22c55e : type.id === 'lemon' ? 0xfacc15 : 0x38bdf8,
        emissive: type.isZombie ? 0x16a34a : 0x0284c7,
        emissiveIntensity: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.58;
    group.add(water);

    // jetpack
    if (type.hasJetpack) {
      const jetMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
      [-0.45, 0.45].forEach(x => {
        const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 12), jetMat);
        jet.position.set(x, 0.2, -0.35);
        jet.castShadow = true;
        group.add(jet);
      });
    }

    // spider legs
    if (type.hasLegs) {
      for (let s = -1; s <= 1; s += 2) {
        for (let f = -1; f <= 1; f += 2) {
          const legGroup = new THREE.Group();
          const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 8), new THREE.MeshStandardMaterial({ color: type.isAstro ? 0x6366f1 : 0x27272a }));
          upper.position.y = -0.3;
          const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x3f3f46 }));
          lower.position.set(0, -0.8, 0.15);
          lower.rotation.x = 0.4;
          legGroup.add(upper, lower);
          legGroup.position.set(s * 0.5, 0.1 + f * 0.1, f * 0.2);
          legGroup.rotation.z = s * 0.6;
          legGroup.rotation.x = f * 0.3;
          group.add(legGroup);
        }
      }
    }

    // head
    const headGeo = new THREE.SphereGeometry(0.38, 24, 24);
    const faceTex = this.createFaceTexture(type, 0.6);
    const headMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.05;
    head.castShadow = true;
    group.add(head);

    // mouth as separate scaling mesh for animation
    const mouthGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 0.88, 0.32);
    mouth.scale.set(1.2, 0.6, 0.5);
    group.add(mouth);

    // eyes glow for astro
    const eyes: THREE.Mesh[] = [];
    if (type.isAstro) {
      const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const eyeMat = new THREE.MeshStandardMaterial({ color: type.accent, emissive: type.accent, emissiveIntensity: 2 });
      [-0.12, 0.12].forEach(x => {
        const e = new THREE.Mesh(eyeGeo, eyeMat);
        e.position.set(x, 1.05, 0.32);
        group.add(e);
        eyes.push(e);
      });
      // helmet
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.44, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.7),
        new THREE.MeshStandardMaterial({ color: type.accent, transparent: true, opacity: 0.25, roughness: 0.1, metalness: 0.8 })
      );
      helm.position.y = 1.1;
      group.add(helm);
    }

    // buzzsaw
    if (type.hasBuzzsaw) {
      const saw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.7, roughness: 0.3 })
      );
      saw.rotation.x = Math.PI / 2;
      saw.position.set(0.55, 0.5, 0.2);
      group.add(saw);
    }

    // scale based on type
    const scaleMap: Record<string, number> = {
      small: 0.7, normal: 1, large: 1.35, jetpack: 1.1, spider: 1.2,
      'astro-trooper': 1.1, 'astro-carrier': 2.8, 'astro-mothership': 4.5,
      'titan-cameraman': 2.6,
    };
    const s = scaleMap[type.id] || 1;
    group.scale.setScalar(s);

    return { group, head, mouth, eyes };
  }

  private createLabel(text: string, color = '#fff') {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(0,0,0,0.75)';
    g.beginPath();
    g.roundRect(10, 10, 492, 90, 16);
    g.fill();
    g.fillStyle = color;
    g.font = '900 32px system-ui';
    g.textAlign = 'center';
    g.fillText(text.slice(0, 22).toUpperCase(), 256, 62);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(2.2, 0.55, 1);
    sprite.position.y = 1.8;
    return { canvas: c, tex, sprite };
  }

  private spawnEnemy(type: SkibidiType) {
    const seed = Math.floor(Math.random() * 100000);
    const { group, head, mouth, eyes } = this.createSkibidiModel(type, seed);
    const ang = Math.random() * Math.PI * 2;
    const rad = 18 + Math.random() * 22;
    group.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);

    const { sprite } = this.createLabel(`${type.nameRu} ${type.rarity}`, type.accent);
    group.add(sprite);

    this.scene.add(group);

    const hpMap: Record<string, number> = { small: 25, normal: 45, large: 90, jetpack: 70, spider: 80, 'astro-trooper': 60, 'astro-carrier': 400, 'astro-mothership': 1200 };
    const hp = hpMap[type.id] || 50 + this.wave * 8;
    const speed = type.hasLegs ? 4.2 : type.hasJetpack ? 5 : type.isAstro ? 3.2 : 2.8;

    this.enemies.push({
      group, type, hp, maxHp: hp, speed, attackCd: 0, dead: false, head, mouth, eyes, wobble: Math.random() * 10, label: sprite,
    });
  }

  // --- GAME LOOP ---

  start() {
    if (this.running) return;
    this.running = true;
    this.phase = 'playing';
    this.reset();
    this.clock.start();
    this.audio.ensure();
    this.audio.play();
    this.loop();
  }

  private reset() {
    this.enemies.forEach(e => this.scene.remove(e.group));
    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.enemies = []; this.projectiles = []; this.particles = [];
    this.hp = this.maxHp; this.score = 0; this.wave = 0; this.time = 0;
    this.spawnQueue = []; this.intermission = 2;
    this.playerPos.set(0, 1.7, 18); this.yaw = 0; this.pitch = 0;
    this.keys.clear();
  }

  restart() {
    this.reset();
    this.phase = 'playing';
    this.onPhase('playing');
    this.lock();
  }

  lock() {
    try { this.canvas.requestPointerLock(); } catch {}
  }
  unlock() {
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch {}
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    this.renderer.dispose();
    this.audio.dispose();
  }

  setMuted(m: boolean) { this.audio.setMuted(m); }

  // input
  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas) return;
    if (this.phase !== 'playing') return;
    const sens = 0.0021;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
  };
  private onMouseDown = (e: MouseEvent) => {
    if (this.phase === 'playing' && document.pointerLockElement !== this.canvas) { this.lock(); return; }
    if (e.button === 0 && this.phase === 'playing') this.firing = true;
  };
  private onMouseUp = (e: MouseEvent) => { if (e.button === 0) this.firing = false; };
  private onLockChange = () => {
    if (document.pointerLockElement !== this.canvas && this.phase === 'playing') {
      this.phase = 'paused';
      this.onPhase('paused');
    }
  };

  // shooting
  private tryShoot() {
    const now = this.time;
    if (now - this.lastShot < 0.16) return;
    this.lastShot = now;
    this.shake = Math.min(this.shake + 0.35, 1);

    (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 1;
    this.muzzleLight.intensity = 18;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const start = new THREE.Vector3();
    this.muzzle.getWorldPosition(start);

    const geo = new THREE.SphereGeometry(0.09, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start);
    this.scene.add(mesh);

    const vel = dir.multiplyScalar(42);
    this.projectiles.push({ mesh, vel, life: 2.2, damage: 32 });
  }

  private collide(px: number, pz: number, r: number) {
    let x = px, z = pz;
    for (const c of this.colliders) {
      const nx = Math.max(c.minX, Math.min(x, c.maxX));
      const nz = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - nx, dz = z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          x = nx + (dx / d) * r;
          z = nz + (dz / d) * r;
        }
      }
    }
    x = Math.max(-MAP, Math.min(MAP, x));
    z = Math.max(-MAP, Math.min(MAP, z));
    return [x, z] as const;
  }

  // loop
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.phase === 'playing' || this.phase === 'cinematic') {
      this.time += dt;
      this.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
    this.pushHud();
  };

  private pushHud() {
    const best = Number(localStorage.getItem('skibidi_best') || 0);
    this.onHud({
      hp: Math.ceil(this.hp),
      maxHp: this.maxHp,
      score: this.score,
      wave: this.wave,
      enemies: this.enemies.length + this.spawnQueue.length,
      ammo: 999,
      time: this.time,
      best,
    });
  }

  private update(dt: number) {
    // waves
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const t = this.spawnQueue.shift()!;
        this.spawnEnemy(t);
        this.spawnTimer = 0.6;
      }
    } else if (this.enemies.length === 0 && this.phase === 'playing') {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.wave++;
        const count = Math.min(2 + this.wave * 1.5, 10);
        const q: SkibidiType[] = [];
        for (let i = 0; i < count; i++) {
          const pool = this.wave < 2 ? SKIBIDI_TYPES.filter(t => t.category === 'toilet' && t.rarity === 'common')
            : this.wave < 4 ? SKIBIDI_TYPES.filter(t => ['toilet', 'mutant'].includes(t.category))
              : SKIBIDI_TYPES.filter(t => t.rarity !== 'common');
          const pick = pool[Math.floor(Math.random() * pool.length)];
          q.push(pick);
        }
        if (this.wave % 3 === 0) {
          const boss = SKIBIDI_TYPES.find(t => t.id === 'astro-carrier') || SKIBIDI_TYPES[SKIBIDI_TYPES.length - 1];
          q.push(boss);
          this.onFeed(`⚠️ ВОЛНА ${this.wave}: ${boss.nameRu.toUpperCase()} ВЫШЕЛ!`, 'bad');
        } else {
          this.onFeed(`🚽 Волна ${this.wave}: ${count} скибиди идут!`, 'info');
        }
        this.spawnQueue = q;
        this.spawnTimer = 0.4;
      }
    }

    if (this.phase === 'cinematic') {
      this.updateCinematic(dt);
    } else {
      this.updatePlayer(dt);
      if (this.firing) this.tryShoot();
    }

    this.updateWeapon(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);

    (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity - dt * 8);
    this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 120);
    this.shake = Math.max(0, this.shake - dt * 3);

    // win
    if (this.score >= KILLS_TO_WIN * 100 && this.phase === 'playing') {
      this.phase = 'menu';
      this.unlock();
      this.onPhase('dead', { score: this.score, wave: this.wave, time: this.time });
      localStorage.setItem('skibidi_best', String(Math.max(Number(localStorage.getItem('skibidi_best') || 0), this.score)));
    }
  }

  private updateCinematic(dt: number) {
    this.cinematicTime += dt;
    const t = this.cinematicTime;
    // epic fly path over city
    const rad = 28 + Math.sin(t * 0.2) * 6;
    const ang = t * 0.25;
    this.camera.position.set(Math.cos(ang) * rad, 12 + Math.sin(t * 0.15) * 4, Math.sin(ang) * rad);
    this.camera.lookAt(0, 1, 0);
    // auto spawn if empty
    if (this.enemies.length < 6 && this.spawnQueue.length === 0) {
      const rnd = SKIBIDI_TYPES[Math.floor(Math.random() * SKIBIDI_TYPES.length)];
      this.spawnEnemy(rnd);
    }
  }

  private updatePlayer(dt: number) {
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    let mx = 0, mz = 0;
    if (this.keys.has('KeyW')) mz += 1;
    if (this.keys.has('KeyS')) mz -= 1;
    if (this.keys.has('KeyA')) mx -= 1;
    if (this.keys.has('KeyD')) mx += 1;
    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }
    const speed = this.keys.has('ShiftLeft') ? 8.5 : 5.2;
    const wish = new THREE.Vector3().addScaledVector(fwd, mz).addScaledVector(right, mx).multiplyScalar(speed * dt);
    let nx = this.playerPos.x + wish.x;
    let nz = this.playerPos.z + wish.z;
    [nx, nz] = this.collide(nx, nz, 0.6);
    this.playerPos.x = nx; this.playerPos.z = nz;

    if (this.keys.has('Space') && this.playerPos.y <= 1.71) this.vy = 5.2;
    this.vy -= 12 * dt;
    this.playerPos.y += this.vy * dt;
    if (this.playerPos.y <= 1.7) { this.playerPos.y = 1.7; this.vy = 0; }

    const sh = (Math.random() - 0.5) * this.shake * 0.08;
    this.camera.position.set(this.playerPos.x + sh, this.playerPos.y + sh, this.playerPos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private updateWeapon(dt: number) {
    this.weapon.position.set(0.35, -0.28 - Math.sin(this.time * 8) * 0.01, -0.55);
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) continue;
      e.wobble += dt * 3;
      e.attackCd -= dt;

      const gp = e.group.position;
      const toP = new THREE.Vector3(this.playerPos.x - gp.x, 0, this.playerPos.z - gp.z);
      const dist = toP.length();
      toP.normalize();

      e.group.rotation.y = Math.atan2(toP.x, toP.z);
      e.group.position.y = Math.abs(Math.sin(e.wobble)) * 0.08;

      // mouth anim to beat
      const mouthOpen = Math.abs(Math.sin(this.time * 14 + e.wobble)) * 0.8 + 0.2;
      e.mouth.scale.set(1.2 + mouthOpen * 0.8, 0.6 + mouthOpen * 1.2, 0.5);
      e.head.rotation.x = Math.sin(this.time * 6 + e.wobble) * 0.15;

      if (this.phase !== 'cinematic' && dist > 1.8) {
        let nx = gp.x + toP.x * e.speed * dt;
        let nz = gp.z + toP.z * e.speed * dt;
        [nx, nz] = this.collide(nx, nz, 0.6);
        gp.x = nx; gp.z = nz;
      } else if (this.phase === 'playing' && e.attackCd <= 0 && dist <= 2.2) {
        e.attackCd = 1.1;
        this.hp -= 8 + this.wave * 1.2;
        this.hurtFlash = performance.now();
        this.shake = 0.8;
        this.onFeed(`${e.type.nameRu} атаковал! -${Math.round(8 + this.wave * 1.2)} HP`, 'bad');
        if (this.hp <= 0) {
          this.hp = 0;
          this.phase = 'dead';
          this.unlock();
          this.audio.stop();
          this.onPhase('dead', { score: this.score, wave: this.wave, time: this.time });
          localStorage.setItem('skibidi_best', String(Math.max(Number(localStorage.getItem('skibidi_best') || 0), this.score)));
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      let dead = p.life <= 0;
      if (Math.abs(p.mesh.position.x) > MAP + 5 || Math.abs(p.mesh.position.z) > MAP + 5) dead = true;

      if (!dead) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (e.dead) continue;
          const ep = e.group.position;
          const dx = p.mesh.position.x - ep.x;
          const dz = p.mesh.position.z - ep.z;
          const dy = p.mesh.position.y - (ep.y + 1);
          if (dx * dx + dz * dz < 1.2 && Math.abs(dy) < 1.8) {
            dead = true;
            e.hp -= p.damage;
            this.hitFlash = performance.now();
            if (e.hp <= 0) {
              this.scene.remove(e.group);
              this.enemies.splice(j, 1);
              this.score += 100 + this.wave * 10;
              this.burst(ep.clone().add(new THREE.Vector3(0, 1, 0)), 0x38bdf8, 16);
              this.onFeed(`${e.type.nameRu} УНИЧТОЖЕН! +${100 + this.wave * 10}`, 'kill');
            } else {
              this.burst(p.mesh.position.clone(), 0xfbbf24, 6);
            }
            break;
          }
        }
      }

      if (dead) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private burst(pos: THREE.Vector3, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshBasicMaterial({ color, transparent: true }));
      m.position.copy(pos);
      this.scene.add(m);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 8);
      this.particles.push({ mesh: m, vel, life: 0, maxLife: 0.6 + Math.random() * 0.6, rot: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0) });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 9 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.rot.x * dt;
      p.mesh.rotation.y += p.rot.y * dt;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - p.life / p.maxLife;
    }
  }

  startCinematic() {
    this.phase = 'cinematic';
    this.cinematicTime = 0;
    this.onPhase('cinematic');
    if (!this.running) {
      this.running = true;
      this.clock.start();
      this.loop();
    }
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
      const dur = 10;
      const was = this.phase;
      this.phase = 'cinematic';
      this.cinematicTime = 0;
      const step = () => {
        if (t >= dur) { rec.stop(); this.phase = was; return; }
        this.cinematicTime = t;
        this.time = t;
        // update a bit
        this.update(1 / 30);
        this.renderer.render(this.scene, this.camera);
        onProgress?.(t / dur);
        t += 1 / 30;
        setTimeout(step, 1000 / 30 / 2);
      };
      step();
    });
  }
}
