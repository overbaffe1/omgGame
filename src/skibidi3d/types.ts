import * as THREE from 'three';
import { SkibidiType } from '../skibidi/types';

export interface Enemy3D {
  group: THREE.Group;
  type: SkibidiType;
  hp: number;
  maxHp: number;
  speed: number;
  attackCd: number;
  dead: boolean;
  head: THREE.Mesh;
  mouth: THREE.Mesh;
  eyes: THREE.Mesh[];
  mixer?: number;
  wobble: number;
  label: THREE.Sprite;
}

export interface Projectile {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  damage: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  rot: THREE.Vector3;
}

export interface Hud3D {
  hp: number;
  maxHp: number;
  score: number;
  wave: number;
  enemies: number;
  ammo: number;
  time: number;
  best: number;
}

export type GamePhase3D = 'menu' | 'playing' | 'paused' | 'dead' | 'cinematic';
