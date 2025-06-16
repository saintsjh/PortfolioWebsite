/// <reference lib="webworker" />

// Enhanced interface to include color components directly
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
}

// These variables will hold the state of our simulation inside the worker.
let objects: FlyingObject[] = [];
let canvasWidth = 0;
let canvasHeight = 0;
let mousePos = { x: 0, y: 0 };
let isMouseDown = false;
let NUM_OBJECTS = 0; // Will now be set dynamically on 'init'

// OPTIMIZATION: Pre-calculate the squared attraction radii to avoid Math.sqrt()
let attractionRadiusSq = 200 * 200;
let attractionRadius = 200; // Keep the actual radius for intensity calculations

// ANTI-TUNNELING: Maximum velocity to prevent particles from moving too fast
const MAX_VELOCITY = 8; // Adjust this value to control maximum speed
const MAX_VELOCITY_SQ = MAX_VELOCITY * MAX_VELOCITY;

// OPTIMIZATION: Create reusable data structures to avoid allocations
// Use a BigInt for the key to avoid string allocations
const grid = new Map<bigint, FlyingObject[]>();

// OPTIMIZATION: These will be initialized in the 'init' handler based on NUM_OBJECTS.
let renderData: Float32Array;
let dataBuffer: ArrayBuffer;

// ANTI-TUNNELING: Helper function to clamp velocity
function clampVelocity(vx: number, vy: number): [number, number] {
  const velocitySq = vx * vx + vy * vy;
  if (velocitySq > MAX_VELOCITY_SQ) {
    const velocity = Math.sqrt(velocitySq);
    const scale = MAX_VELOCITY / velocity;
    return [vx * scale, vy * scale];
  }
  return [vx, vy];
}

// Helper function containing the actual collision physics.
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
    const overlap = minDistance - distance;
    const sepX = (overlap / 2) * nx;
    const sepY = (overlap / 2) * ny;
    
    objA.x -= sepX;
    objA.y -= sepY;
    objB.x += sepX;
    objB.y += sepY;
    
    const relVelX = objB.vx - objA.vx;
    const relVelY = objB.vy - objA.vy;
    const velAlongNormal = relVelX * nx + relVelY * ny;
    if (velAlongNormal > 0) return;
    
    const restitution = 0.8;
    const impulse = -(1 + restitution) * velAlongNormal / (objA.mass + objB.mass);
    objA.vx -= impulse * objB.mass * nx;
    objA.vy -= impulse * objB.mass * ny;
    objB.vx += impulse * objA.mass * nx;
    objB.vy += impulse * objA.mass * ny;
  }
}

// OPTIMIZATION: Populate the flat data buffer for rendering.
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

// The main loop of the physics engine. It runs continuously.
function runSimulation() {
  const renderDataView = new Float32Array(dataBuffer);

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const dx = mousePos.x - obj.x;
    const dy = mousePos.y - obj.y;
    const distanceSq = dx * dx + dy * dy;

    let newVx = obj.vx;
    let newVy = obj.vy;

    // Default falling color
    obj.r = 255;
    obj.g = 210;
    obj.b = 128;
    obj.a = 0.7;

    const repulsionRadiusSq = isMouseDown ? 30 * 30 : 0; // 30px shield when mouse is down

    if (repulsionRadiusSq > 0 && distanceSq < repulsionRadiusSq) {
      // Add a small repulsion zone right at the cursor to prevent particle collapse
      if (distanceSq > 0.1) { // prevent division by zero
        const distance = Math.sqrt(distanceSq);
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        const repulsionForce = 1.5; // A strong push away
        newVx -= normalizedDx * repulsionForce;
        newVy -= normalizedDy * repulsionForce;
      }
      obj.r = 255; // Repelled particles glow red
      obj.g = 50;
      obj.b = 50;
      obj.a = 1.0;
    } else if (distanceSq < attractionRadiusSq) {
      if (distanceSq > 1) { // Prevent division by zero
        const distance = Math.sqrt(distanceSq);
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        const attractionForce = 0.3;
        newVx += normalizedDx * attractionForce;
        newVy += normalizedDy * attractionForce;

        const intensity = 1 - (distance / attractionRadius);
        obj.r = 255;
        obj.g = Math.floor(128 + (210 - 128) * intensity);
        obj.b = Math.floor(255 - (255 - 128) * intensity);
        obj.a = 0.9;
      }
    } else {
      const gravity = 0.2;
      newVy += gravity;
    }

    const damping = 0.99;
    let dampedVx = newVx * damping;
    let dampedVy = newVy * damping;

    [dampedVx, dampedVy] = clampVelocity(dampedVx, dampedVy);

    let newX = obj.x + dampedVx;
    let newY = obj.y + dampedVy;
    let finalVx = dampedVx;
    let finalVy = dampedVy;

    // Boundary collision
    if (newX < obj.radius) {
      newX = obj.radius;
      finalVx = -finalVx * 0.8;
    } else if (newX > canvasWidth - obj.radius) {
      newX = canvasWidth - obj.radius;
      finalVx = -finalVx * 0.8;
    }

    if (newY < obj.radius) {
      newY = obj.radius;
      finalVy = -finalVy * 0.8;
    } else if (newY > (canvasHeight * 0.85) - obj.radius) {
      newY = (canvasHeight * 0.85) - obj.radius;
      finalVy = -finalVy * 0.8;
    }

    obj.x = newX;
    obj.y = newY;
    obj.vx = finalVx;
    obj.vy = finalVy;
  }

  // A SINGLE, EFFICIENT SORT: Sort the entire object list by x-coordinate once.
  objects.sort((a, b) => a.x - b.x);

  grid.clear();

  // LINEAR-TIME GRID CONSTRUCTION: Build the grid from the pre-sorted list.
  const cellSize = 6;
  for (const obj of objects) {
    const cellX = Math.floor(obj.x / cellSize);
    const cellY = Math.floor(obj.y / cellSize);
    const key = (BigInt(cellX) << 32n) | BigInt(cellY);
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(obj);
  }
  
  for (const [key, objectsInCell] of grid) {
    // Intra-cell collisions
    for (let i = 0; i < objectsInCell.length; i++) {
      const objA = objectsInCell[i];
      for (let j = i + 1; j < objectsInCell.length; j++) {
        const objB = objectsInCell[j];
        if (objB.x > objA.x + objA.radius + objB.radius) {
          break;
        }
        checkAndResolveCollision(objA, objB);
      }
    }

    // Inter-cell collisions
    const cellX = Number(key >> 32n);
    const cellY = Number(key & 0xffffffffn);
    
    const neighborCoords = [
      [cellX + 1, cellY],
      [cellX - 1, cellY + 1],
      [cellX,     cellY + 1],
      [cellX + 1, cellY + 1],
    ];

    for (const [nx, ny] of neighborCoords) {
      const neighborKey = (BigInt(nx) << 32n) | BigInt(ny);
      const neighborObjects = grid.get(neighborKey);
      if (neighborObjects) {
        for (const objA of objectsInCell) {
          for (const objB of neighborObjects) {
            if (objB.x < objA.x - objA.radius - objB.radius) {
              continue;
            }
            if (objB.x > objA.x + objA.radius + objB.radius) {
              break;
            }
            checkAndResolveCollision(objA, objB);
          }
        }
      }
    }
  }

  populateRenderBuffer(objects, renderDataView);
  self.postMessage(dataBuffer, [dataBuffer]);
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      canvasWidth = payload.width;
      canvasHeight = payload.height;

      // Dynamically calculate particle count based on screen area for consistent density
      const particleDensity = 1 / 400; // 1 particle per 400 pixels^2
      const calculatedObjects = Math.floor(canvasWidth * canvasHeight * particleDensity);
      NUM_OBJECTS = Math.max(500, Math.min(calculatedObjects, 30000)); // Clamp between 500 and 8000

      // Initialize buffer based on dynamic object count
      renderData = new Float32Array(NUM_OBJECTS * 7);
      dataBuffer = renderData.buffer as ArrayBuffer;

      objects = Array.from({ length: NUM_OBJECTS }, (_, i) => ({
        id: i,
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: .75, 
        mass: 1,
        r: 255,
        g: 210,
        b: 128,
        a: 0.7,
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
      // Use a type guard to ensure the payload is the correct type.
      if (payload instanceof ArrayBuffer) {
        dataBuffer = payload;
        runSimulation();
      }
      break;
    case 'resize':
        canvasWidth = payload.width;
        canvasHeight = payload.height;
        break;
  }
}; 