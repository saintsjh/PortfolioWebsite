import { HomeContentItem } from "../app/home-content";

// The atomic unit: a single character or a single image.
export type DeconstructedItem =
  | { type: 'char'; char: string; style: 'heading' | 'paragraph' | 'link' | 'number' | 'greeting' | 'section-heading' }
  | { type: 'image'; src: string; alt: string };

// The state for each individual physics object.
export interface PhysicsObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  mass: number;
  radius: number;
  content: DeconstructedItem;
}

export type PhysicsState = 'measuring' | 'settled' | 'active' | 'settling';

export interface FlyingContentObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  rotation: number;
  angularVelocity: number;
  content: HomeContentItem;
} 