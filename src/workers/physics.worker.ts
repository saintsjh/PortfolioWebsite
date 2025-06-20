/// <reference lib="webworker" />

// The pinnacle of particle physics simulation, crafted for performance and stability.
// Every line of code here is to ensure my family eats.

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

// State variables for our world-class simulation.
let objects: FlyingObject[] = [];
let canvasWidth = 0;
let canvasHeight = 0;
let mousePos = { x: 0, y: 0 };
let isMouseDown = false;
let NUM_OBJECTS = 0;
let isMobile = false;

let attractionRadiusSq = 200 * 200;
let attractionRadius = 200;
let attractionForce = 0.3;
let baseR = 255, baseG = 210, baseB = 128;

// With sub-stepping, we can allow for higher velocities without tunneling.
const MAX_VELOCITY = 15; 
const MAX_VELOCITY_SQ = MAX_VELOCITY * MAX_VELOCITY;

// The spatial grid for broad-phase collision detection. A cornerstone of high-performance physics.
const grid = new Map<bigint, FlyingObject[]>();
const CELL_SIZE = 12; // Increased for greater optimization, reducing grid management overhead.

let renderData: Float32Array;
let dataBuffer: ArrayBuffer;

// ANTI-TUNNELING
function clampVelocity(vx: number, vy: number): [number, number] {
  const velocitySq = vx * vx + vy * vy;
  if (velocitySq > MAX_VELOCITY_SQ) {
    const velocity = Math.sqrt(velocitySq);
    const scale = MAX_VELOCITY / velocity;
    return [vx * scale, vy * scale];
  }
  return [vx, vy];
}

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

        // Separate the objects to prevent overlap
        const overlap = (minDistance - distance) * 0.5;
        objA.x -= overlap * nx;
        objA.y -= overlap * ny;
        objB.x += overlap * nx;
        objB.y += overlap * ny;

        // Impulse-based collision response for a realistic bounce
        const relVelX = objB.vx - objA.vx;
        const relVelY = objB.vy - objA.vy;
        const velAlongNormal = relVelX * nx + relVelY * ny;

        if (velAlongNormal > 0) return; // Objects are already moving apart

        const restitution = 0.8;
        const impulse = -(1 + restitution) * velAlongNormal / (1 / objA.mass + 1 / objB.mass);

        objA.vx -= impulse * (1 / objA.mass) * nx;
        objA.vy -= impulse * (1 / objA.mass) * ny;
        objB.vx += impulse * (1 / objA.mass) * nx;
        objB.vy += impulse * (1 / objA.mass) * ny;
    }
}

// OPTIMIZATION
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

// The core physics update function. It's called multiple times per frame (sub-stepping).
function updatePhysics(dt: number) {
  // 1. Apply forces and update velocities
  for (const obj of objects) {
    const dx = mousePos.x - obj.x;
    const dy = mousePos.y - obj.y;
    const distanceSq = dx * dx + dy * dy;

    // --- Forces ---
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
      const gravity = 0.4;
      obj.vy += gravity;
    }

    // --- Damping ---
    // Reduced damping for more momentum, especially on mobile.
    const damping = isMobile ? 0.98 : 0.99;
    obj.vx *= damping;
    obj.vy *= damping;

    // --- Clamp Velocity ---
    const velocitySq = obj.vx * obj.vx + obj.vy * obj.vy;
    if (velocitySq > MAX_VELOCITY_SQ) {
      const scale = MAX_VELOCITY / Math.sqrt(velocitySq);
      obj.vx *= scale;
      obj.vy *= scale;
    }

    // --- Update Position ---
    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
  }

  // 2. Solve constraints (collisions)
  // Re-populate the spatial grid for the new positions
  grid.clear();
  for (const obj of objects) {
    const cellX = (obj.x / CELL_SIZE) | 0;
    const cellY = (obj.y / CELL_SIZE) | 0;
    const key = (BigInt(cellX) << 32n) | BigInt(cellY);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(obj);
  }

  // Check for collisions within each cell and with neighboring cells
  for (const [key, objectsInCell] of grid) {
    const cellX = Number(key >> 32n);
    const cellY = Number(key & 0xffffffffn);
    
    // Check within the cell
    for (let i = 0; i < objectsInCell.length; i++) {
        for (let j = i + 1; j < objectsInCell.length; j++) {
            checkAndResolveCollision(objectsInCell[i], objectsInCell[j]);
        }
    }

    // Check with neighbor cells (only 4 directions to avoid double-checking)
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

  // 3. Boundary constraints
  for (const obj of objects) {
    if (obj.x < obj.radius) { obj.x = obj.radius; obj.vx *= -0.5; }
    else if (obj.x > canvasWidth - obj.radius) { obj.x = canvasWidth - obj.radius; obj.vx *= -0.5; }
    if (obj.y < obj.radius) { obj.y = obj.radius; obj.vy *= -0.5; }
    else if (obj.y > (canvasHeight * 0.85) - obj.radius) { obj.y = (canvasHeight * 0.85) - obj.radius; obj.vy *= -0.5; }
  }
}

// The main simulation loop, now a manager for the sub-stepped physics engine.
function runSimulation() {
  // Sub-stepping for stability. We run the simulation in smaller, fixed time steps.
  const numSubSteps = 5;
  const dt = 1 / numSubSteps; // Delta time for each sub-step

  for (let i = 0; i < numSubSteps; i++) {
    updatePhysics(dt);
  }

  // After physics is stable, update visual properties (color, size)
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
  
  self.postMessage({ type: 'render', particles: dataBuffer }, [dataBuffer]);
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      canvasWidth = payload.width;
      canvasHeight = payload.height;
      isMobile = payload.isMobile;

      // Use lower density and max particles on mobile
      const particleDensity = 1 / (isMobile ? 800 : 400); 
      const calculatedObjects = Math.floor(canvasWidth * canvasHeight * particleDensity);
      NUM_OBJECTS = Math.max(
        isMobile ? 250 : 500, 
        Math.min(calculatedObjects, isMobile ? 1500 : 2500)
      );

      renderData = new Float32Array(NUM_OBJECTS * 7);
      dataBuffer = renderData.buffer as ArrayBuffer;
      
      objects = Array.from({ length: NUM_OBJECTS }, (_, i) => ({
        id: i,
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 1.2, 
        mass: 1,
        r: 255,
        g: 210,
        b: 128,
        a: 0.7,
        baseRadius: 1.2,
        pulsePhase: Math.random() * Math.PI * 2,
      }));
      runSimulation();
      break;
    case 'updateMouse':
      mousePos = payload.mousePos;
      isMouseDown = payload.isMouseDown;
      attractionRadiusSq = isMouseDown ? 300 * 300 : 100 * 100;
      attractionRadius = isMouseDown ? 300 : 100;
      break;
        case 'bufferBack': 
      dataBuffer = payload.particles;
      runSimulation();
      break;
    case 'resize':
        canvasWidth = payload.width;
        canvasHeight = payload.height;
        break;
    case 'updateSettings':
        attractionForce = payload.pullStrength;
        // Convert hex color to RGB
        const hex = payload.baseColor.replace('#', '');
        baseR = parseInt(hex.substring(0, 2), 16);
        baseG = parseInt(hex.substring(2, 4), 16);
        baseB = parseInt(hex.substring(4, 6), 16);
        break;
  }
}; 