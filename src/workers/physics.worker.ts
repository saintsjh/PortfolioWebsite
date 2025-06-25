import { WorkerMessage, RenderMessage } from "@/types/physics-worker";

/// <reference lib="webworker" />

// Particle physics simulation worker

interface FlyingObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  r: number;
  g: number;
  b: number;
  a: number;
  baseRadius: number;
  pulsePhase: number;
}

// Simulation world state
let objects: FlyingObject[] = [];
let canvasWidth = 0;
let canvasHeight = 0;
let mousePos = { x: 0, y: 0 };
let isMouseDown = false;
let NUM_OBJECTS = 0;
let isMobile = false;

// Simulation parameters
let attractionRadiusSq = 200 * 200;
let attractionRadius = 200;
let attractionForce = 0.3;
let baseR = 255, baseG = 210, baseB = 128;

const MAX_VELOCITY = 15; 
const MAX_VELOCITY_SQ = MAX_VELOCITY * MAX_VELOCITY;

const CELL_SIZE = 12;
const grid = new Map<bigint, FlyingObject[]>();

let renderData: Float32Array;
let dataBuffer: ArrayBuffer;

// Collision detection and resolution
function checkAndResolveCollision(objA: FlyingObject, objB: FlyingObject) {
    const dx = objB.x - objA.x;
    const dy = objB.y - objA.y;
    const distanceSq = dx * dx + dy * dy;
    const minDistance = objA.radius + objB.radius;
    const minDistanceSq = minDistance * minDistance;

    if (distanceSq < minDistanceSq && distanceSq > 0) {
        const distance = Math.sqrt(distanceSq);
        const nx = dx / distance;
        const ny = dy / distance;

        // Separate objects to prevent overlap
        const overlap = (minDistance - distance) * 0.5;
        objA.x -= overlap * nx;
        objA.y -= overlap * ny;
        objB.x += overlap * nx;
        objB.y += overlap * ny;

        // Calculate impulse for collision response
        const relVelX = objB.vx - objA.vx;
        const relVelY = objB.vy - objA.vy;
        const velAlongNormal = relVelX * nx + relVelY * ny;

        if (velAlongNormal > 0) return;

        const restitution = 0.8;
        const impulse = -(1 + restitution) * velAlongNormal / (1 / objA.mass + 1 / objB.mass);

        objA.vx -= impulse * (1 / objA.mass) * nx;
        objA.vy -= impulse * (1 / objA.mass) * ny;
        objB.vx += impulse * (1 / objA.mass) * nx;
        objB.vy += impulse * (1 / objA.mass) * ny;
    }
}

// Populate render buffer with particle data
function populateRenderBuffer(objects: FlyingObject[], renderDataView: Float32Array) {
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const offset = i * 7;
    renderDataView[offset] = obj.x;
    renderDataView[offset + 1] = obj.y;
    renderDataView[offset + 2] = obj.radius;
    renderDataView[offset + 3] = obj.r;
    renderDataView[offset + 4] = obj.g;
    renderDataView[offset + 5] = obj.b;
    renderDataView[offset + 6] = obj.a;
  }
}

// Core physics update function
function updatePhysics(dt: number) {
  // Apply forces and update velocities
  for (const obj of objects) {
    const dx = mousePos.x - obj.x;
    const dy = mousePos.y - obj.y;
    const distanceSq = dx * dx + dy * dy;
    const repulsionRadiusSq = isMouseDown ? 60 * 60 : 0;
    if (repulsionRadiusSq > 0 && distanceSq < repulsionRadiusSq) {
      if (distanceSq > 0.1) {
        const distance = Math.sqrt(distanceSq);
        const nx = dx / distance;
        const ny = dy / distance;
        const repulsionForce = 2.5;
        obj.vx -= nx * repulsionForce;
        obj.vy -= ny * repulsionForce;
      }
    } else if (distanceSq < attractionRadiusSq) {
      if (distanceSq > 1) {
        const distance = Math.sqrt(distanceSq);
        const nx = dx / distance;
        const ny = dy / distance;
        obj.vx += nx * attractionForce;
        obj.vy += ny * attractionForce;
      }
    } else {
      const gravity = 0.0000001;
      obj.vy += gravity;
    }

    // Damping
    const damping = isMobile ? 0.98 : 0.99;
    obj.vx *= damping;
    obj.vy *= damping;

    // Clamp velocity
    const velocitySq = obj.vx * obj.vx + obj.vy * obj.vy;
    if (velocitySq > MAX_VELOCITY_SQ) {
      const scale = MAX_VELOCITY / Math.sqrt(velocitySq);
      obj.vx *= scale;
      obj.vy *= scale;
    }

    // Update position
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  }

  // Solve collisions using spatial grid
  grid.clear();
  for (const obj of objects) {
    const cellX = (obj.x / CELL_SIZE) | 0;
    const cellY = (obj.y / CELL_SIZE) | 0;
    const key = (BigInt(cellX) << 32n) | BigInt(cellY);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(obj);
  }

  // Check collisions within cells and neighbors
  for (const [key, objectsInCell] of grid) {
    const cellX = Number(key >> 32n);
    const cellY = Number(key & 0xffffffffn);
    
    // Check within cell
    for (let i = 0; i < objectsInCell.length; i++) {
        for (let j = i + 1; j < objectsInCell.length; j++) {
            checkAndResolveCollision(objectsInCell[i], objectsInCell[j]);
        }
    }

    // Check neighbor cells
    const neighborCoords = [[cellX + 1, cellY], [cellX - 1, cellY + 1], [cellX, cellY + 1], [cellX + 1, cellY + 1]];
    for (const [nx, ny] of neighborCoords) {
        const neighborKey = (BigInt(nx) << 32n) | BigInt(ny);
        const neighborObjects = grid.get(neighborKey);
        if (neighborObjects) {
            for (const objA of objectsInCell) {
                for (const objB of neighborObjects) {
                    checkAndResolveCollision(objA, objB);
                }
            }
        }
    }
  }

  // Boundary constraints
  for (const obj of objects) {
    if (obj.x < obj.radius) { obj.x = obj.radius; obj.vx *= -0.5; }
    else if (obj.x > canvasWidth - obj.radius) { obj.x = canvasWidth - obj.radius; obj.vx *= -0.5; }
    if (obj.y < obj.radius) { obj.y = obj.radius; obj.vy *= -0.5; }
    else if (obj.y > (canvasHeight * 0.85) - obj.radius) { obj.y = (canvasHeight * 0.85) - obj.radius; obj.vy *= -0.5; }
  }
}

// Main simulation loop
function runSimulation() {
  // Sub-stepping for stability
  const numSubSteps = 5;
  const dt = 1 / numSubSteps;

  for (let i = 0; i < numSubSteps; i++) {
    updatePhysics(dt);
  }

  // Update visual properties
  for (const obj of objects) {
    const velocitySq = obj.vx * obj.vx + obj.vy * obj.vy;
    const normalizedVelocity = Math.min(velocitySq / MAX_VELOCITY_SQ, 1);
    const distance = Math.sqrt((mousePos.x - obj.x)**2 + (mousePos.y - obj.y)**2);
    
    const maxDistanceForSizing = 150;
    const distanceEffect = Math.max(0, 1 - (distance / maxDistanceForSizing));
    obj.radius = obj.baseRadius + (distanceEffect * 0.5);

    obj.pulsePhase += 0.15;
    const pulseEffect = Math.sin(obj.pulsePhase) * 0.1 + 1;

    obj.r = (baseR - normalizedVelocity * 50) | 0;
    obj.g = (baseG - normalizedVelocity * 30) | 0;
    obj.b = (baseB + normalizedVelocity * 50) | 0;
    obj.a = 0.7 + normalizedVelocity * 0.2;

    const repulsionRadiusSq = isMouseDown ? 60 * 60 : 0;
    if (repulsionRadiusSq > 0 && distance < Math.sqrt(repulsionRadiusSq)) {
      obj.r = 255; obj.g = 50; obj.b = 50; obj.a = 1.0;
    } else if (distance < attractionRadius) {
      const intensity = 1 - (distance / attractionRadius);
      obj.radius = obj.baseRadius * pulseEffect + (distanceEffect * 0.5);
      obj.r = (baseR - normalizedVelocity * 30) | 0;
      obj.g = (baseG * intensity + normalizedVelocity * 40) | 0;
      obj.b = (baseB + (255 - baseB) * intensity + normalizedVelocity * 60) | 0;
      obj.a = 0.9 + normalizedVelocity * 0.1;
    }
  }
  
  const renderDataView = new Float32Array(dataBuffer);
  populateRenderBuffer(objects, renderDataView);
  
  const message: RenderMessage = { type: 'render', particles: dataBuffer };
  (self as any).postMessage(message, [dataBuffer]);
}

// Handle messages from main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init': {
      canvasWidth = payload.width;
      canvasHeight = payload.height;
      isMobile = payload.isMobile;
      NUM_OBJECTS = isMobile ? 1200 : 2500;
      attractionRadius = Math.min(canvasWidth, canvasHeight) * 0.3;
      attractionRadiusSq = attractionRadius * attractionRadius;

      objects = [];
      for (let i = 0; i < NUM_OBJECTS; i++) {
        const radius = Math.random() * (isMobile ? 1.5 : 2.5) + 1;
        objects.push({
          id: i,
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight * 0.5,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          radius,
          mass: radius * radius * 0.1,
          r: baseR, g: baseG, b: baseB, a: 1,
          baseRadius: radius,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
      
      dataBuffer = new ArrayBuffer(NUM_OBJECTS * 7 * 4);
      runSimulation();
      break;
    }
    case 'resize': {
      canvasWidth = payload.width;
      canvasHeight = payload.height;
      attractionRadius = Math.min(canvasWidth, canvasHeight) * 0.3;
      attractionRadiusSq = attractionRadius * attractionRadius;
      break;
    }
    case 'updateMouse': {
      mousePos = payload.mousePos;
      isMouseDown = payload.isMouseDown;
      break;
    }
    case 'bufferBack': {
      dataBuffer = payload.particles;
      runSimulation();
      break;
    }
    case 'updateSettings': {
      attractionForce = payload.pullStrength;
      const hex = payload.baseColor.replace('#', '');
      baseR = parseInt(hex.substring(0, 2), 16);
      baseG = parseInt(hex.substring(2, 4), 16);
      baseB = parseInt(hex.substring(4, 6), 16);
      break;
    }
  }
}; 