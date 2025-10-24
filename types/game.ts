export interface Position {
  x: number;
  y: number;
}

export interface Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hit: boolean;
  missed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

export interface GameState {
  bow: Position;
  target: Position & { radius: number };
  arrow: Arrow | null;
  particles: Particle[];
  targetMoving: boolean;
  targetSpeed: number;
  targetDirection: number;
}

export interface LevelConfig {
  targetRadius: number;
  moving: boolean;
  speed: number;
  name: string;
  distance: number;
}

export type GameStatus = "menu" | "ready" | "flying" | "won" | "lost";
