import * as THREE from 'three';
import { SoundManager } from './sounds';

export interface HudState {
  hp: number;
  maxHp: number;
  kills: number;
  score: number;
  wave: number;
  enemiesLeft: number;
  diploma: number; // 0..100
  overheat: number;
  overheated: boolean;
  rapid: boolean;
  shield: boolean;
  hitmarker: number; // timestamp of last hit
  hurtFlash: number;
  time: number;
  best: number;
  killsNeeded: number;
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'dead' | 'victory';

interface CB {
  onHud: (h: HudState) => void;
  onPhase: (p: GamePhase, data?: any) => void;
  onFeed: (text: string, kind: 'kill' | 'info' | 'bad' | 'good') => void;
}

type EnemyType = 'assistant' | 'docent' | 'professor' | 'fizruk' | 'dean';

interface Enemy {
  group: THREE.Group;
  mats: THREE.MeshStandardMaterial[];
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  name: string;
  type: EnemyType;
  attackCd: number;
  flash: number;
  scale: number;
  label: THREE.Sprite;
  labelCanvas: HTMLCanvasElement;
  labelTex: THREE.CanvasTexture;
  dead: boolean;
  wobble: number;
  score: number;
  height: number;
}

interface Proj {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  spin: THREE.Vector3;
  gravity: number;
}

interface Pickup {
  group: THREE.Group;
  kind: 'heal' | 'rapid' | 'shield';
  life: number;
}

const KILLS_NEEDED = 30;
const MAP = 34; // half size

const NAMES: Record<EnemyType, string[]> = {
  assistant: ['Аспирант Толик', 'Лаборант Серёга', 'Ассистент Колян'],
  docent: ['Доцент Петрович', 'МарьИванна (История)', 'Зинаида Павловна'],
  professor: ['Профессор Матана', 'Проф. Сопромата', 'Проф. Философии'],
  fizruk: ['Физрук Димон', 'Физрук Валера'],
  dean: ['ДЕКАН Иваныч', 'РЕКТОР Всея ПсковГУ'],
};

const SUIT: Record<EnemyType, number> = {
  assistant: 0x3b82f6,
  docent: 0x4b5563,
  professor: 0x7c2d12,
  fizruk: 0xdc2626,
  dean: 0x111827,
};

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export class PskovGame {
  private canvas: HTMLCanvasElement;
  private cb: CB;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  private keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private playerPos = new THREE.Vector3(0, 1.7, 12);
  private vy = 0;
  private grounded = true;
  private hp = 100;
  private maxHp = 100;
  private lastDamageT = -99;
  private time = 0;

  private weapon!: THREE.Group;
  private muzzle!: THREE.Object3D;
  private muzzleLight!: THREE.PointLight;
  private muzzleFlash!: THREE.Mesh;
  private recoil = 0;
  private bobPhase = 0;
  private overheat = 0;
  private overheatedUntil = 0;
  private lastShot = 0;
  private firing = false;
  private rapidUntil = 0;
  private shieldUntil = 0;
  private shake = 0;
  private hurtFlashT = 0;
  private hitmarkerT = 0;

  private enemies: Enemy[] = [];
  private projs: Proj[] = [];
  private particles: Particle[] = [];
  private pickups: Pickup[] = [];
  private colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];

  private wave = 0;
  private kills = 0;
  private score = 0;
  private spawnQueue: EnemyType[] = [];
  private spawnTimer = 0;
  private intermission = 3;
  private phase: GamePhase = 'menu';
  private running = false;
  private victoryTimer = -1;
  private deathTimer = -1;
  private pickupTimer = 12;
  private stepTimer = 0;

  sound = new SoundManager();

  // touch
  touchMove = { x: 0, z: 0 };
  touchLook = { dx: 0, dy: 0 };

  private projGeo = new THREE.SphereGeometry(0.14, 12, 12);
  private projMat = new THREE.MeshBasicMaterial({ color: 0xfff7ae });
  private particleGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);

  constructor(canvas: HTMLCanvasElement, cb: CB) {
    this.canvas = canvas;
    this.cb = cb;
    this.init();
  }

  // ---------- INIT ----------
  private init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1026);
    this.scene.fog = new THREE.Fog(0x0b1026, 18, 85);

    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 220);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.copy(this.playerPos);
    this.scene.add(this.camera);

    // lights
    const hemi = new THREE.HemisphereLight(0x9db8ff, 0x2a1f1a, 0.85);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffd9a0, 1.4);
    sun.position.set(22, 34, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
    sun.shadow.camera.far = 100;
    this.scene.add(sun);
    const moon = new THREE.DirectionalLight(0x7aa2ff, 0.5);
    moon.position.set(-20, 30, -20);
    this.scene.add(moon);

    this.buildEnvironment();
    this.buildWeapon();

    // stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      starPos[i * 3] = rand(-150, 150);
      starPos[i * 3 + 1] = rand(25, 120);
      starPos[i * 3 + 2] = rand(-150, 150);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.8 }));
    this.scene.add(stars);

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onLockChange);
  }

  // ---------- ENV ----------
  private makeCanvas(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d')!;
    draw(g);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { c, t };
  }

  private buildEnvironment() {
    // ground
    const { t: groundTex } = this.makeCanvas(512, 512, (g) => {
      g.fillStyle = '#1a2238'; g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#202a45';
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) g.fillRect(i * 64, j * 64, 64, 64);
      }
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) {
        g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke();
        g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke();
      }
    });
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(10, 10);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP * 2 + 20, MAP * 2 + 20),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // center emblem
    const { t: emblemTex } = this.makeCanvas(512, 512, (g) => {
      g.clearRect(0, 0, 512, 512);
      g.strokeStyle = '#fbbf24'; g.lineWidth = 14;
      g.beginPath(); g.arc(256, 256, 200, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#fbbf24';
      g.font = '900 72px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('ПсковГУ', 256, 230);
      g.font = '700 40px system-ui';
      g.fillText('★ 1932 ★', 256, 310);
    });
    const emblem = new THREE.Mesh(
      new THREE.CircleGeometry(7, 48),
      new THREE.MeshBasicMaterial({ map: emblemTex, transparent: true, opacity: 0.9 })
    );
    emblem.rotation.x = -Math.PI / 2;
    emblem.position.y = 0.02;
    this.scene.add(emblem);

    // outer university buildings (4 walls facades)
    const facade = (_w: number, _h: number, label: string) => {
      const { t } = this.makeCanvas(1024, 256, (g) => {
        g.fillStyle = '#2b1d16'; g.fillRect(0, 0, 1024, 256);
        g.fillStyle = '#3d2b20'; g.fillRect(0, 200, 1024, 56);
        // windows
        for (let i = 0; i < 12; i++) {
          const x = 20 + i * 84;
          const lit = Math.random() > 0.35;
          g.fillStyle = lit ? '#ffd97a' : '#131a2e';
          g.fillRect(x, 40, 56, 80);
          g.strokeStyle = '#0b1026'; g.lineWidth = 4;
          g.strokeRect(x, 40, 56, 80);
          g.beginPath(); g.moveTo(x + 28, 40); g.lineTo(x + 28, 120); g.stroke();
        }
        g.fillStyle = '#f8fafc'; g.font = '900 44px system-ui'; g.textAlign = 'center';
        g.fillText(label, 512, 190);
      });
      t.wrapS = THREE.RepeatWrapping;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
    };

    const wallH = 9;
    const mkWall = (x: number, z: number, w: number, ry: number, label: string) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 1.6), facade(w, wallH, label));
      m.position.set(x, wallH / 2, z);
      m.rotation.y = ry;
      m.receiveShadow = true;
      this.scene.add(m);
    };
    mkWall(0, -MAP - 1, MAP * 2 + 8, 0, 'ПСКОВСКИЙ ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ');
    mkWall(0, MAP + 1, MAP * 2 + 8, Math.PI, 'КОРПУС №1 • УЛ. ЛЕНИНА 2');
    mkWall(-MAP - 1, 0, MAP * 2 + 8, Math.PI / 2, 'СЕССИЯ • ЗАЧЁТЫ • ДИПЛОМ');
    mkWall(MAP + 1, 0, MAP * 2 + 8, -Math.PI / 2, 'НЕ СДАЛ — ОТЧИСЛЕН ★');

    this.colliders.push(
      { minX: -MAP - 2, maxX: MAP + 2, minZ: -MAP - 2.2, maxZ: -MAP + 0.2 },
      { minX: -MAP - 2, maxX: MAP + 2, minZ: MAP - 0.2, maxZ: MAP + 2.2 },
      { minX: -MAP - 2.2, maxX: -MAP + 0.2, minZ: -MAP - 2, maxZ: MAP + 2 },
      { minX: MAP - 0.2, maxX: MAP + 2.2, minZ: -MAP - 2, maxZ: MAP + 2 },
    );

    // columns
    const colGeo = new THREE.CylinderGeometry(0.7, 0.85, 7, 10);
    const colMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.7 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4, metalness: 0.4 });
    const colPositions: [number, number][] = [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, -20], [0, 20]];
    colPositions.forEach(([x, z]) => {
      const c = new THREE.Mesh(colGeo, colMat);
      c.position.set(x, 3.5, z);
      c.castShadow = true; c.receiveShadow = true;
      this.scene.add(c);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), capMat);
      cap.position.set(x, 7.2, z);
      this.scene.add(cap);
      this.colliders.push({ minX: x - 1, maxX: x + 1, minZ: z - 1, maxZ: z + 1 });
    });

    // desks (парты) as cover
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const deskTop = new THREE.MeshStandardMaterial({ color: 0xd6a35c, roughness: 0.7 });
    const deskSpots: [number, number, number][] = [
      [-6, -4, 0.3], [6, -4, -0.3], [-6, 4, -0.2], [6, 4, 0.4], [-18, 0, 1.2], [18, 0, -1.1], [0, -8, 0], [0, 8, 0.1],
    ];
    deskSpots.forEach(([x, z, r]) => {
      const grp = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 1.4), deskTop);
      top.position.y = 1.05; top.castShadow = true;
      grp.add(top);
      [[-1.4, -0.55], [1.4, -0.55], [-1.4, 0.55], [1.4, 0.55]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), deskMat);
        leg.position.set(lx, 0.52, lz);
        grp.add(leg);
      });
      // bench
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.5), deskMat);
      bench.position.set(0, 0.55, 1.1);
      grp.add(bench);
      grp.position.set(x, 0, z);
      grp.rotation.y = r;
      this.scene.add(grp);
      this.colliders.push({ minX: x - 1.8, maxX: x + 1.8, minZ: z - 1.1, maxZ: z + 1.1 });
    });

    // fountain center
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 1, 20), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 }));
    fBase.position.set(0, 0.5, -2);
    fBase.castShadow = true;
    this.scene.add(fBase);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.3, 20), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }));
    water.position.set(0, 1.05, -2);
    this.scene.add(water);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.4, 12), capMat);
    pillar.position.set(0, 2, -2);
    pillar.castShadow = true;
    this.scene.add(pillar);
    this.colliders.push({ minX: -3.8, maxX: 3.8, minZ: -5.8, maxZ: 1.8 });

    // lamps
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.6 });
    const lampPositions: [number, number][] = [[-24, -24], [24, -24], [-24, 24], [24, 24]];
    lampPositions.forEach(([x, z]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), poleMat);
      pole.position.set(x, 3, z);
      this.scene.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(x, 6.2, z);
      this.scene.add(bulb);
      const pl = new THREE.PointLight(0xffc46b, 18, 26, 1.8);
      pl.position.set(x, 6, z);
      this.scene.add(pl);
    });

    // posters (funny)
    const posters: [string, string, string][] = [
      ['СЕССИЯ', 'не сдал — гуляй', '#dc2626'],
      ['ПСКОВГУ', 'учимся с 1932 года', '#2563eb'],
      ['ДИПЛОМ', 'всего 30 зачётов!', '#16a34a'],
      ['ТИХО!', 'идёт пара', '#9333ea'],
    ];
    posters.forEach(([t1, t2, col], i) => {
      const { t } = this.makeCanvas(256, 340, (g) => {
        g.fillStyle = '#f8fafc'; g.fillRect(0, 0, 256, 340);
        g.fillStyle = col; g.fillRect(0, 0, 256, 110);
        g.fillStyle = '#fff'; g.font = '900 38px system-ui'; g.textAlign = 'center';
        g.fillText(t1, 128, 68);
        g.fillStyle = '#0f172a'; g.font = '700 26px system-ui';
        g.fillText(t2, 128, 180);
        g.font = '400 20px system-ui'; g.fillStyle = '#475569';
        g.fillText('★ ПсковГУ ★', 128, 230);
        g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(4, 4, 248, 332);
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.9), new THREE.MeshBasicMaterial({ map: t }));
      const ang = (i / posters.length) * Math.PI * 2;
      p.position.set(Math.sin(ang) * (MAP - 0.1), 3.2, Math.cos(ang) * (MAP - 0.1));
      p.lookAt(0, 3.2, 0);
      this.scene.add(p);
    });
  }

  // ---------- WEAPON (пародийный мультяшный бластер) ----------
  private buildWeapon() {
    this.weapon = new THREE.Group();
    const pink = new THREE.MeshStandardMaterial({ color: 0xff7aa2, roughness: 0.35, metalness: 0.1 });
    const pinkLight = new THREE.MeshStandardMaterial({ color: 0xffa9c4, roughness: 0.3, emissive: 0xff4d7e, emissiveIntensity: 0.25 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1e1b24, roughness: 0.6, metalness: 0.3 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.7 });

    // grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.13), dark);
    grip.position.set(0, -0.18, 0.1);
    grip.rotation.x = 0.25;
    this.weapon.add(grip);

    // main body — стилизованный «ствол»
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.55, 20), pink);
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0, -0.15);
    this.weapon.add(body);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 20), pinkLight);
    head.scale.set(1, 0.95, 1.25);
    head.position.set(0, 0.005, -0.46);
    this.weapon.add(head);

    // slit (дуло)
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16), dark);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(0, 0.005, -0.585);
    this.weapon.add(hole);

    // base spheres
    const bGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const b1 = new THREE.Mesh(bGeo, pink);
    b1.position.set(-0.085, -0.1, 0.1);
    const b2 = new THREE.Mesh(bGeo, pink);
    b2.position.set(0.085, -0.1, 0.1);
    this.weapon.add(b1, b2);

    // gold ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.018, 10, 24), gold);
    ring.position.set(0, 0, 0.05);
    this.weapon.add(ring);

    // sight
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.08), dark);
    sight.position.set(0, 0.11, -0.1);
    this.weapon.add(sight);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
    dot.position.set(0, 0.14, -0.1);
    this.weapon.add(dot);

    this.weapon.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = false; });

    this.weapon.position.set(0.32, -0.3, -0.55);
    this.camera.add(this.weapon);

    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0.005, -0.62);
    this.weapon.add(this.muzzle);

    this.muzzleLight = new THREE.PointLight(0xffd1e3, 0, 9, 2);
    this.muzzleLight.position.set(0.32, -0.2, -1.2);
    this.camera.add(this.muzzleLight);

    this.muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0 })
    );
    this.muzzleFlash.position.set(0, 0.005, -0.66);
    this.weapon.add(this.muzzleFlash);
  }

  // ---------- ENEMIES ----------
  private makeFace(type: EnemyType) {
    const { t } = this.makeCanvas(128, 128, (g) => {
      g.fillStyle = '#ffcf9e'; g.fillRect(0, 0, 128, 128);
      // angry eyes
      g.fillStyle = '#fff';
      g.fillRect(18, 42, 34, 26);
      g.fillRect(76, 42, 34, 26);
      g.fillStyle = '#0f172a';
      g.beginPath(); g.arc(35, 58, 7, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(93, 58, 7, 0, Math.PI * 2); g.fill();
      // angry brows
      g.strokeStyle = '#0f172a'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(14, 32); g.lineTo(56, 44); g.stroke();
      g.beginPath(); g.moveTo(114, 32); g.lineTo(72, 44); g.stroke();
      // mouth yelling
      g.fillStyle = '#7f1d1d';
      g.beginPath(); g.ellipse(64, 100, 20, 13, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fecaca';
      g.fillRect(50, 96, 28, 6);
      if (type === 'professor' || type === 'dean') {
        // glasses
        g.strokeStyle = '#0f172a'; g.lineWidth = 4;
        g.strokeRect(14, 38, 42, 34); g.strokeRect(72, 38, 42, 34);
        g.beginPath(); g.moveTo(56, 52); g.lineTo(72, 52); g.stroke();
      }
      if (type === 'dean') {
        g.fillStyle = '#fbbf24'; g.fillRect(0, 0, 128, 14);
      }
      if (type === 'fizruk') {
        g.fillStyle = '#0f172a'; g.font = '900 20px system-ui'; g.textAlign = 'center';
        g.fillText('СВИСТОК', 64, 22);
      }
    });
    return t;
  }

  private makeLabel(name: string): { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; sprite: THREE.Sprite } {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(2.6, 0.65, 1);
    this.drawLabel(canvas, tex, name, 1);
    return { canvas, tex, sprite };
  }

  private drawLabel(canvas: HTMLCanvasElement, tex: THREE.CanvasTexture, name: string, frac: number) {
    const g = canvas.getContext('2d')!;
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = 'rgba(8,10,24,0.82)';
    const w = 460;
    g.beginPath();
    (g as any).roundRect ? (g as any).roundRect(26, 8, w, 76, 16) : g.rect(26, 8, w, 76);
    g.fill();
    g.fillStyle = '#fff';
    g.font = '800 30px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(name.toUpperCase().slice(0, 22), 256, 52);
    // hp bar
    g.fillStyle = '#1f2937'; g.fillRect(56, 62, 400, 12);
    const col = frac > 0.6 ? '#4ade80' : frac > 0.3 ? '#fbbf24' : '#ef4444';
    g.fillStyle = col; g.fillRect(56, 62, 400 * Math.max(0, frac), 12);
    tex.needsUpdate = true;
  }

  private spawnEnemy(type: EnemyType, pos?: THREE.Vector3) {
    const scaleMap: Record<EnemyType, number> = { assistant: 0.92, docent: 1, professor: 1.12, fizruk: 1.05, dean: 1.65 };
    const hpMap: Record<EnemyType, number> = { assistant: 30, docent: 65, professor: 130, fizruk: 85, dean: 420 + this.wave * 60 };
    const spdMap: Record<EnemyType, number> = { assistant: 4.4, docent: 3.7, professor: 2.9, fizruk: 5.4, dean: 2.5 };
    const dmgMap: Record<EnemyType, number> = { assistant: 8, docent: 12, professor: 18, fizruk: 15, dean: 26 };
    const scoreMap: Record<EnemyType, number> = { assistant: 100, docent: 200, professor: 350, fizruk: 300, dean: 1200 };
    const s = scaleMap[type];
    const group = new THREE.Group();
    const mats: THREE.MeshStandardMaterial[] = [];
    const mat = (c: number) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }); mats.push(m); return m; };

    // legs
    const legGeo = new THREE.BoxGeometry(0.22 * s, 0.8 * s, 0.22 * s);
    const pants = mat(0x1f2937);
    const l1 = new THREE.Mesh(legGeo, pants); l1.position.set(-0.16 * s, 0.4 * s, 0);
    const l2 = new THREE.Mesh(legGeo, pants); l2.position.set(0.16 * s, 0.4 * s, 0);
    // torso (пиджак)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72 * s, 0.9 * s, 0.4 * s), mat(SUIT[type]));
    torso.position.y = 1.25 * s;
    // shirt + tie
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.7 * s, 0.42 * s), mat(0xf8fafc));
    shirt.position.y = 1.28 * s;
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09 * s, 0.55 * s, 0.44 * s), mat(0xdc2626));
    tie.position.y = 1.25 * s;
    // arms with указкой / журналом
    const armGeo = new THREE.BoxGeometry(0.16 * s, 0.75 * s, 0.16 * s);
    const a1 = new THREE.Mesh(armGeo, mat(SUIT[type])); a1.position.set(-0.46 * s, 1.25 * s, 0); a1.rotation.z = 0.15;
    const a2 = new THREE.Mesh(armGeo, mat(SUIT[type])); a2.position.set(0.46 * s, 1.25 * s, 0.1); a2.rotation.x = -0.9;
    // stick (указка)
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9 * s, 6), mat(0xfbbf24));
    stick.position.set(0.46 * s, 1.1 * s, 0.55 * s);
    stick.rotation.x = 1.2;
    // head
    const headMat = new THREE.MeshStandardMaterial({ map: this.makeFace(type), roughness: 0.6 });
    mats.push(headMat);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.5 * s, 0.5 * s), headMat);
    head.position.y = 1.95 * s;
    // hair / лысина
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.52 * s, 0.12 * s, 0.52 * s), mat(type === 'professor' || type === 'dean' ? 0xd1d5db : 0x3b2f2f));
    hair.position.y = 2.22 * s;
    if (type === 'dean') {
      // корона ректора lol + живот
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.22 * s, 0.2 * s, 8), mat(0xfbbf24));
      crown.position.y = 2.42 * s;
      group.add(crown);
      torso.scale.x = 1.25;
    }
    group.add(l1, l2, torso, shirt, tie, a1, a2, stick, head, hair);
    group.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; } });

    const p = pos ?? this.randomSpawnPos();
    group.position.copy(p);

    const name = type === 'dean' && this.wave >= 6 ? 'РЕКТОР Всея ПсковГУ' : pick(NAMES[type]);
    const { canvas, tex, sprite } = this.makeLabel(name + (type === 'dean' ? ' ★BOSS★' : ''));
    sprite.position.y = 2.65 * s;
    group.add(sprite);

    this.scene.add(group);
    const e: Enemy = {
      group, mats, hp: hpMap[type], maxHp: hpMap[type],
      speed: spdMap[type] * rand(0.9, 1.1), damage: dmgMap[type],
      name, type, attackCd: 0, flash: 0, scale: s,
      label: sprite, labelCanvas: canvas, labelTex: tex,
      dead: false, wobble: Math.random() * 10, score: scoreMap[type], height: 2.4 * s,
    };
    this.enemies.push(e);
  }

  private randomSpawnPos(): THREE.Vector3 {
    for (let i = 0; i < 20; i++) {
      const x = rand(-MAP + 3, MAP - 3);
      const z = rand(-MAP + 3, MAP - 3);
      const d = Math.hypot(x - this.playerPos.x, z - this.playerPos.z);
      if (d > 14) return new THREE.Vector3(x, 0, z);
    }
    return new THREE.Vector3(rand(-20, 20), 0, -MAP + 4);
  }

  // ---------- PICKUPS ----------
  private spawnPickupAt(pos: THREE.Vector3, force?: Pickup['kind']) {
    const kind: Pickup['kind'] = force ?? (Math.random() < 0.45 ? 'heal' : Math.random() < 0.6 ? 'rapid' : 'shield');
    const grp = new THREE.Group();
    let core: THREE.Mesh;
    if (kind === 'heal') {
      core = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 14),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.7, roughness: 0.3 }));
      const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      cross1.position.z = 0.29;
      const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      cross2.position.z = 0.29;
      grp.add(cross1, cross2);
      const label = this.textSprite('ЭНЕРГЕТИК +40 HP', '#4ade80');
      label.position.y = 1.1;
      grp.add(label);
    } else if (kind === 'rapid') {
      core = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.6 }));
      const label = this.textSprite('ШПОРА: RAPID 10с', '#fde047');
      label.position.y = 1.1;
      grp.add(label);
    } else {
      core = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x2563eb, emissiveIntensity: 0.7 }));
      const label = this.textSprite('ВЗЯТКА: ЩИТ 10с', '#93c5fd');
      label.position.y = 1.1;
      grp.add(label);
    }
    core.position.y = 0.6;
    core.castShadow = true;
    grp.add(core);
    // ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15;
    grp.add(ring);
    grp.position.set(pos.x, 0, pos.z);
    this.scene.add(grp);
    this.pickups.push({ group: grp, kind, life: 25 });
  }

  private textSprite(text: string, color: string) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 96;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(0,0,0,0.75)';
    g.fillRect(0, 0, 512, 96);
    g.fillStyle = color;
    g.font = '800 36px system-ui';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 50);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    s.scale.set(2.4, 0.45, 1);
    return s;
  }

  // ---------- PARTICLES ----------
  private burst(pos: THREE.Vector3, color: number, count: number, speed = 6, up = 4) {
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(this.particleGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
      m.position.copy(pos);
      m.position.y += rand(-0.3, 0.5);
      m.scale.setScalar(rand(0.6, 1.6));
      this.scene.add(m);
      const v = new THREE.Vector3(rand(-speed, speed), rand(0.5, up + speed * 0.5), rand(-speed, speed));
      this.particles.push({ mesh: m, vel: v, life: 0, maxLife: rand(0.5, 1.1), spin: new THREE.Vector3(rand(-8, 8), rand(-8, 8), 0), gravity: 12 });
    }
  }

  private gradeBurst(pos: THREE.Vector3) {
    // красные двойки
    for (let i = 0; i < 8; i++) {
      const { t } = this.makeCanvas(64, 64, (g) => {
        g.fillStyle = '#ef4444'; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.font = '900 40px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('2', 32, 34);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
      m.position.copy(pos);
      m.position.y += 1.2;
      this.scene.add(m);
      const v = new THREE.Vector3(rand(-4, 4), rand(3, 7), rand(-4, 4));
      this.particles.push({ mesh: m, vel: v, life: 0, maxLife: rand(0.7, 1.2), spin: new THREE.Vector3(0, rand(-5, 5), 0), gravity: 8 });
    }
  }

  // ---------- PUBLIC CONTROL ----------
  start() {
    if (this.running) return;
    this.running = true;
    this.phase = 'playing';
    this.reset();
    this.clock.start();
    this.loop();
  }

  private reset() {
    // clear entities
    this.enemies.forEach((e) => this.scene.remove(e.group));
    this.projs.forEach((p) => this.scene.remove(p.mesh));
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.pickups.forEach((p) => this.scene.remove(p.group));
    this.enemies = []; this.projs = []; this.particles = []; this.pickups = [];
    this.hp = this.maxHp;
    this.kills = 0; this.score = 0; this.wave = 0;
    this.spawnQueue = []; this.intermission = 2.5;
    this.keys.clear();
    this.firing = false;
    this.playerPos.set(0, 1.7, 12);
    this.yaw = 0; this.pitch = 0;
    this.vy = 0; this.time = 0;
    this.overheat = 0; this.victoryTimer = -1; this.deathTimer = -1;
    this.rapidUntil = 0; this.shieldUntil = 0;
    this.pickupTimer = 14;
  }

  restart() {
    this.reset();
    this.phase = 'playing';
    this.running = true;
    this.cb.onPhase('playing');
    this.lock();
  }

  lock() {
    this.sound.ensure();
    try { this.canvas.requestPointerLock(); } catch { /* noop */ }
  }

  unlock() {
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch { /* noop */ }
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
  }

  setMuted(m: boolean) { this.sound.setMuted(m); }

  // ---------- INPUT ----------
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
    const sens = 0.0022;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.phase !== 'playing') return;
    if (document.pointerLockElement !== this.canvas) { this.lock(); return; }
    if (e.button === 0) this.firing = true;
  };
  private onMouseUp = (e: MouseEvent) => { if (e.button === 0) this.firing = false; };

  private onLockChange = () => {
    if (document.pointerLockElement !== this.canvas && this.phase === 'playing' && this.running) {
      this.phase = 'paused';
      this.cb.onPhase('paused');
    }
  };

  resume() {
    this.phase = 'playing';
    this.cb.onPhase('playing');
    this.lock();
  }

  // touch helpers called from React
  addLook(dx: number, dy: number) {
    if (this.phase !== 'playing') return;
    this.yaw -= dx * 0.0045;
    this.pitch -= dy * 0.0045;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
  }
  setTouchMove(x: number, z: number) { this.touchMove.x = x; this.touchMove.z = z; }
  setTouchFire(v: boolean) { this.firing = v; }

  // ---------- SHOOT ----------
  private tryShoot(dt: number) {
    void dt;
    const now = this.time;
    const rapid = now < this.rapidUntil;
    const interval = rapid ? 0.09 : 0.16;
    if (now - this.lastShot < interval) return;
    if (now < this.overheatedUntil) { return; }
    if (this.overheat >= 100) {
      this.overheatedUntil = now + 1.4;
      this.overheat = 100;
      this.sound.overheat();
      this.cb.onFeed('ХУЕмёт перегрелся! Остывает...', 'bad');
      return;
    }
    this.lastShot = now;
    this.overheat = Math.min(100, this.overheat + (rapid ? 5 : 8));
    this.recoil = 1;
    this.shake = Math.min(0.5, this.shake + 0.12);
    this.sound.shoot();
    (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 1;
    this.muzzleFlash.scale.setScalar(rand(0.8, 1.4));
    this.muzzleLight.intensity = 24;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    // slight spread when overheated
    const spread = this.overheat > 60 ? 0.02 : 0.006;
    dir.x += rand(-spread, spread); dir.y += rand(-spread, spread); dir.z += rand(-spread, spread);
    dir.normalize();

    const start = new THREE.Vector3();
    this.muzzle.getWorldPosition(start);
    const mesh = new THREE.Mesh(this.projGeo, this.projMat);
    mesh.position.copy(start);
    // glow sprite
    this.scene.add(mesh);
    const vel = dir.multiplyScalar(rapid ? 70 : 58);
    // inherit player velocity a bit
    this.projs.push({ mesh, vel, life: 2 });
  }

  private collide(px: number, pz: number, r: number): [number, number] {
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
        } else {
          // inside: push out by smallest penetration
          const pushL = x - c.minX + r, pushR = c.maxX - x + r;
          const pushU = z - c.minZ + r, pushD = c.maxZ - z + r;
          const m = Math.min(pushL, pushR, pushU, pushD);
          if (m === pushL) x = c.minX - r;
          else if (m === pushR) x = c.maxX + r;
          else if (m === pushU) z = c.minZ - r;
          else z = c.maxZ + r;
        }
      }
    }
    x = Math.max(-MAP, Math.min(MAP, x));
    z = Math.max(-MAP, Math.min(MAP, z));
    return [x, z];
  }

  // ---------- LOOP ----------
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.phase === 'playing') {
      this.time += dt;
      this.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
    // push HUD ~ every frame (cheap)
    if (this.running) this.pushHud();
  };

  private pushHud() {
    const best = Number(localStorage.getItem('pskovgu_best') ?? 0);
    this.cb.onHud({
      hp: Math.max(0, Math.ceil(this.hp)),
      maxHp: this.maxHp,
      kills: this.kills,
      score: this.score,
      wave: Math.max(1, this.wave),
      enemiesLeft: this.enemies.length + this.spawnQueue.length,
      diploma: Math.min(100, Math.round((this.kills / KILLS_NEEDED) * 100)),
      overheat: Math.round(this.overheat),
      overheated: this.time < this.overheatedUntil,
      rapid: this.time < this.rapidUntil,
      shield: this.time < this.shieldUntil,
      hitmarker: this.hitmarkerT,
      hurtFlash: this.hurtFlashT,
      time: this.time,
      best,
      killsNeeded: KILLS_NEEDED,
    });
  }

  private update(dt: number) {
    // intermission / waves
    if (this.victoryTimer < 0 && this.deathTimer < 0) {
      if (this.spawnQueue.length > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          const t = this.spawnQueue.shift()!;
          this.spawnEnemy(t);
          this.spawnTimer = 0.7;
        }
      } else if (this.enemies.length === 0) {
        this.intermission -= dt;
        if (this.intermission <= 0) {
          this.wave++;
          const count = Math.min(3 + this.wave * 2, 12);
          const q: EnemyType[] = [];
          for (let i = 0; i < count; i++) {
            const r = Math.random();
            if (this.wave < 2) q.push(r < 0.6 ? 'assistant' : 'docent');
            else if (this.wave < 4) q.push(r < 0.35 ? 'assistant' : r < 0.65 ? 'docent' : r < 0.85 ? 'fizruk' : 'professor');
            else q.push(r < 0.25 ? 'assistant' : r < 0.5 ? 'docent' : r < 0.7 ? 'fizruk' : 'professor');
          }
          if (this.wave % 3 === 0) {
            q.push('dean');
            this.cb.onFeed(`⚠️ ВОЛНА ${this.wave}: ДЕКАН ВЫШЕЛ НА ОХОТУ!`, 'bad');
          } else {
            this.cb.onFeed(`📚 Волна ${this.wave}: преподы идут! (${count})`, 'info');
          }
          this.spawnQueue = q;
          this.spawnTimer = 0.5;
          this.sound.wave();
          // heal small between waves
          this.hp = Math.min(this.maxHp, this.hp + 15);
        }
      }
    }

    // timed pickups
    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.pickupTimer = rand(14, 22);
      const p = new THREE.Vector3(rand(-24, 24), 0, rand(-24, 24));
      const [x, z] = this.collide(p.x, p.z, 1);
      this.spawnPickupAt(new THREE.Vector3(x, 0, z));
    }

    this.updatePlayer(dt);
    if (this.firing) this.tryShoot(dt);
    this.updateWeapon(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updatePickups(dt);

    // overheat cool
    this.overheat = Math.max(0, this.overheat - dt * (this.firing ? 8 : 26));
    this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 160);
    (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity - dt * 10);

    // hp regen
    if (this.time - this.lastDamageT > 5 && this.hp > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + dt * 4);
    }

    // victory
    if (this.kills >= KILLS_NEEDED && this.victoryTimer < 0 && this.deathTimer < 0) {
      this.victoryTimer = 1.6;
      this.sound.victory();
      this.cb.onFeed('🎓 ДИПЛОМ ПОЧТИ ТВОЙ! Добивай последнего препода!', 'good');
      this.burst(this.playerPos.clone().add(new THREE.Vector3(0, 1, -2)), 0xfbbf24, 40, 8, 8);
    }
    if (this.victoryTimer > 0) {
      this.victoryTimer -= dt;
      if (Math.random() < 0.3) {
        const fwd = new THREE.Vector3();
        this.camera.getWorldDirection(fwd);
        this.burst(this.playerPos.clone().add(fwd.multiplyScalar(3)), pick([0xfbbf24, 0x4ade80, 0xff7aa2, 0x60a5fa]), 6, 5, 6);
      }
      if (this.victoryTimer <= 0) {
        this.phase = 'victory';
        this.unlock();
        const best = Number(localStorage.getItem('pskovgu_best') ?? 0);
        if (this.score > best) localStorage.setItem('pskovgu_best', String(this.score));
        this.cb.onPhase('victory', { kills: this.kills, score: this.score, time: this.time, wave: this.wave });
      }
    }

    if (this.deathTimer > 0) {
      this.deathTimer -= dt;
      // fall cam
      this.camera.position.y = Math.max(0.4, this.camera.position.y - dt * 2.2);
      this.camera.rotation.z += dt * 0.6;
      if (this.deathTimer <= 0) {
        this.phase = 'dead';
        this.unlock();
        const best = Number(localStorage.getItem('pskovgu_best') ?? 0);
        if (this.score > best) localStorage.setItem('pskovgu_best', String(this.score));
        this.cb.onPhase('dead', { kills: this.kills, score: this.score, time: this.time, wave: this.wave });
      }
    }

    // camera transform + shake
    this.shake = Math.max(0, this.shake - dt * 2.2);
    const shX = (Math.random() - 0.5) * this.shake * 0.12;
    const shY = (Math.random() - 0.5) * this.shake * 0.12;
    this.camera.position.set(this.playerPos.x + shX, this.playerPos.y + shY, this.playerPos.z);
    this.camera.rotation.set(this.pitch, this.yaw, this.deathTimer > 0 ? this.camera.rotation.z : 0);
  }

  private updatePlayer(dt: number) {
    if (this.deathTimer > 0) return;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    let mx = 0, mz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) mz += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) mz -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    mx += this.touchMove.x;
    mz += this.touchMove.z;
    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = sprint ? 9 : 6;
    const wish = new THREE.Vector3()
      .addScaledVector(fwd, mz)
      .addScaledVector(right, mx)
      .multiplyScalar(speed * dt);
    let nx = this.playerPos.x + wish.x;
    let nz = this.playerPos.z + wish.z;
    [nx, nz] = this.collide(nx, nz, 0.65);
    const moving = len > 0.1;
    this.playerPos.x = nx; this.playerPos.z = nz;

    // jump / gravity
    if ((this.keys.has('Space')) && this.grounded) { this.vy = 4.6; this.grounded = false; }
    if (!this.grounded || this.playerPos.y > 1.7) {
      this.vy -= 12 * dt;
      this.playerPos.y += this.vy * dt;
      if (this.playerPos.y <= 1.7) { this.playerPos.y = 1.7; this.vy = 0; this.grounded = true; }
    }

    if (moving && this.grounded) {
      this.bobPhase += dt * (sprint ? 11 : 8);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) { this.stepTimer = sprint ? 0.3 : 0.42; this.sound.step(); }
    }
  }

  private updateWeapon(dt: number) {
    this.recoil = Math.max(0, this.recoil - dt * 7);
    const moving = this.keys.has('KeyW') || this.keys.has('KeyA') || this.keys.has('KeyS') || this.keys.has('KeyD') || Math.hypot(this.touchMove.x, this.touchMove.z) > 0.1;
    const bobY = moving ? Math.sin(this.bobPhase) * 0.018 : Math.sin(this.time * 1.8) * 0.006;
    const bobX = moving ? Math.cos(this.bobPhase * 0.5) * 0.012 : 0;
    const overheated = this.time < this.overheatedUntil;
    const heatShake = overheated ? Math.sin(this.time * 40) * 0.008 : 0;
    // heat glow
    const heat = this.overheat / 100;
    this.weapon.children.forEach((c) => {
      if (c instanceof THREE.Mesh) {
        const m = c.material as THREE.MeshStandardMaterial;
        if (m.emissive && m.color.getHex() === 0xff7aa2) {
          m.emissive.setHex(0xff2d55);
          m.emissiveIntensity = heat * 0.9;
        }
      }
    });
    this.weapon.position.set(
      0.32 + bobX + heatShake,
      -0.3 + bobY - this.recoil * 0.06,
      -0.55 + this.recoil * 0.14
    );
    this.weapon.rotation.set(this.recoil * 0.35, 0, 0);
  }

  private updateEnemies(dt: number) {
    const pp = this.playerPos;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) continue;
      e.wobble += dt * 6;
      e.attackCd -= dt;
      e.flash = Math.max(0, e.flash - dt);
      const gp = e.group.position;
      const toP = new THREE.Vector3(pp.x - gp.x, 0, pp.z - gp.z);
      const dist = toP.length();
      toP.normalize();
      // face player
      e.group.rotation.y = Math.atan2(toP.x, toP.z);
      // hop bob
      e.group.position.y = Math.abs(Math.sin(e.wobble)) * 0.08;
      // flash
      e.mats.forEach((m) => {
        if (e.flash > 0) { m.emissive.setHex(0xffffff); m.emissiveIntensity = 0.9; }
        else { m.emissiveIntensity = 0; }
      });

      if (dist > 2.1 * e.scale) {
        let nx = gp.x + toP.x * e.speed * dt;
        let nz = gp.z + toP.z * e.speed * dt;
        // simple de-collide with other enemies
        for (const o of this.enemies) {
          if (o === e) continue;
          const dx = nx - o.group.position.x, dz = nz - o.group.position.z;
          const d = Math.hypot(dx, dz);
          if (d < 1 && d > 0.01) { nx += (dx / d) * dt * 2; nz += (dz / d) * dt * 2; }
        }
        [nx, nz] = this.collide(nx, nz, 0.55 * e.scale);
        gp.x = nx; gp.z = nz;
      } else {
        // attack!
        if (e.attackCd <= 0) {
          e.attackCd = e.type === 'dean' ? 1.1 : 0.95;
          // lunge anim
          e.group.position.x += toP.x * 0.35;
          e.group.position.z += toP.z * 0.35;
          this.damagePlayer(e.damage * rand(0.85, 1.15));
          this.cb.onFeed(`${e.name} влепил тебе «пару»! -${Math.round(e.damage)} HP`, 'bad');
        }
      }
    }
  }

  private damagePlayer(amount: number) {
    if (this.deathTimer > 0 || this.victoryTimer > 0) return;
    if (this.time < this.shieldUntil) amount *= 0.25;
    this.hp -= amount;
    this.lastDamageT = this.time;
    this.hurtFlashT = performance.now();
    this.shake = Math.min(1, this.shake + 0.5);
    this.sound.hurt();
    this.burst(this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xef4444, 6, 4, 3);
    if (this.hp <= 0) {
      this.hp = 0;
      this.deathTimer = 1.6;
      this.sound.defeat();
      this.cb.onFeed('💀 ТЕБЯ ОТЧИСЛИЛИ...', 'bad');
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      // trail particles occasionally
      if (Math.random() < 0.5) {
        const t = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffc4d6, transparent: true, opacity: 0.8 }));
        t.position.copy(p.mesh.position);
        this.scene.add(t);
        this.particles.push({ mesh: t, vel: new THREE.Vector3(0, 0.5, 0), life: 0, maxLife: 0.3, spin: new THREE.Vector3(), gravity: 0 });
      }
      let dead = p.life <= 0;
      // walls
      if (Math.abs(p.mesh.position.x) > MAP + 1 || Math.abs(p.mesh.position.z) > MAP + 1 || p.mesh.position.y < 0 || p.mesh.position.y > 12) dead = true;
      // obstacles quick check
      if (!dead) {
        for (const c of this.colliders) {
          if (p.mesh.position.x > c.minX && p.mesh.position.x < c.maxX && p.mesh.position.z > c.minZ && p.mesh.position.z < c.maxZ && p.mesh.position.y < 3) {
            this.burst(p.mesh.position, 0xfde68a, 5, 3, 3);
            dead = true;
            break;
          }
        }
      }
      // enemies
      if (!dead) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (e.dead) continue;
          const ep = e.group.position;
          const dx = p.mesh.position.x - ep.x;
          const dz = p.mesh.position.z - ep.z;
          const dy = p.mesh.position.y - (ep.y + 1.3 * e.scale);
          if (dx * dx + dz * dz < (0.75 * e.scale) ** 2 && Math.abs(dy) < 1.4 * e.scale) {
            // HIT
            dead = true;
            const dmg = 26;
            e.hp -= dmg;
            e.flash = 0.12;
            this.hitmarkerT = performance.now();
            this.drawLabel(e.labelCanvas, e.labelTex, e.name, Math.max(0, e.hp / e.maxHp));
            this.sound.hit();
            this.burst(p.mesh.position, 0xfff7ae, 7, 5, 4);
            if (e.hp <= 0) this.killEnemy(e, j);
            break;
          }
        }
      }
      if (dead) {
        this.scene.remove(p.mesh);
        this.projs.splice(i, 1);
      }
    }
  }

  private killEnemy(e: Enemy, index: number) {
    e.dead = true;
    this.scene.remove(e.group);
    this.enemies.splice(index, 1);
    this.kills++;
    this.score += e.score + this.wave * 20;
    this.hitmarkerT = performance.now();
    this.sound.kill();
    const pos = e.group.position.clone();
    pos.y = 1.2;
    // confetti + grades
    this.burst(pos, 0x4ade80, 14, 7, 7);
    this.burst(pos, 0xfbbf24, 10, 6, 6);
    this.burst(pos, 0xff7aa2, 10, 6, 6);
    this.gradeBurst(pos);
    const msgs = [
      `${e.name} ОТЧИСЛЕН! +1 зачёт 🎓`,
      `${e.name} завалил сессию!`,
      `${e.name} отправлен в деканат!`,
      `Ты засадил ${e.name} по самые... зачёты!`,
    ];
    this.cb.onFeed(pick(msgs), 'kill');
    // drop chance
    if (Math.random() < 0.22) this.spawnPickupAt(pos);
    if (e.type === 'dean') {
      this.cb.onFeed(`👑 ${e.name} ПОВЕРЖЕН! +${e.score} очков! Так держать, студент!`, 'good');
      this.score += 500;
      this.hp = Math.min(this.maxHp, this.hp + 40);
      this.spawnPickupAt(pos, 'heal');
      this.shake = 1;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        const m = p.mesh.material as THREE.Material;
        if ('map' in m && (m as any).map) (m as any).map.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y < 0.05) { p.mesh.position.y = 0.05; p.vel.y *= -0.4; p.vel.x *= 0.7; p.vel.z *= 0.7; }
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      const f = 1 - p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      if (mat.transparent !== true) mat.transparent = true;
      mat.opacity = Math.min(1, f * 1.5);
    }
    if (this.particles.length > 400) {
      const extra = this.particles.splice(0, this.particles.length - 400);
      extra.forEach((p) => this.scene.remove(p.mesh));
    }
  }

  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.life -= dt;
      pk.group.rotation.y += dt * 1.8;
      pk.group.position.y = Math.sin(this.time * 3 + i) * 0.12;
      (pk.group.children[pk.group.children.length - 1] as THREE.Mesh).rotation.z += dt;
      if (pk.life <= 0) {
        this.scene.remove(pk.group);
        this.pickups.splice(i, 1);
        continue;
      }
      const d = Math.hypot(pk.group.position.x - this.playerPos.x, pk.group.position.z - this.playerPos.z);
      if (d < 1.6) {
        if (pk.kind === 'heal') {
          this.hp = Math.min(this.maxHp, this.hp + 40);
          this.sound.heal();
          this.cb.onFeed('⚡ Энергетик! +40 HP. Сессия продолжается!', 'good');
          this.burst(this.playerPos.clone(), 0x4ade80, 12, 4, 5);
        } else if (pk.kind === 'rapid') {
          this.rapidUntil = this.time + 10;
          this.sound.pickup();
          this.cb.onFeed('📝 Шпора подобрана! RAPID-FIRE 10 сек!', 'good');
        } else {
          this.shieldUntil = this.time + 10;
          this.sound.pickup();
          this.cb.onFeed('💼 Взятка принята! Щит 10 сек (урон -75%)', 'good');
        }
        this.score += 50;
        this.scene.remove(pk.group);
        this.pickups.splice(i, 1);
      }
    }
  }
}
