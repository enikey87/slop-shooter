import type { Enemy } from '../state';

/** Что поведение знает о ситуации на этом тике и что может поменять. */
export interface Steer {
  dt: number;
  /** вектор и расстояние до игрока */
  dx: number; dy: number; d: number;
  /** скорость с учётом замедлений */
  spd: number; slow: number;
  /** желаемая скорость — поведение перезаписывает */
  vx: number; vy: number;
}
/** Ауры, которые враги накладывают на игрока, пока рядом. */
export interface Auras { guilt: boolean; timeSlow: boolean; wobble: boolean; mogged: boolean }
export type Behavior = (e: Enemy, s: Steer, auras: Auras) => void;
