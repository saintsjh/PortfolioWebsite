/// <reference lib="webworker" />

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

// These variables will hold the state of our simulation inside the worker.
let objects: FlyingObject[] = [];
let canvasWidth = 0;
let canvasHeight = 0;
let mousePos = { x: 0, y: 0 };
let isMouseDown = false;
let NUM_OBJECTS = 0; // Will now be set dynamically on 'init'


let attractionRadiusSq = 200 * 200;
let attractionRadius = 200; // Keep the actual radius for intensity calculations
let attractionForce = 0.3;
let baseR = 255, baseG = 210, baseB = 128;

// ANTI-TUNNELING
const MAX_VELOCITY = 8; // Adjust this value to control maximum speed
const MAX_VELOCITY_SQ = MAX_VELOCITY * MAX_VELOCITY;

const grid = new Map<bigint, FlyingObject[]>();

// OPTIMIZATION
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

function runSimulation() {
  const renderDataView = new Float32Array(dataBuffer);

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const dx = mousePos.x - obj.x;
    const dy = mousePos.y - obj.y;
    const distanceSq = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSq);

    let newVx = obj.vx;
    let newVy = obj.vy;

    // Calculate velocity magnitude for color effects
    const velocity = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
    const normalizedVelocity = Math.min(velocity / MAX_VELOCITY, 1);

    // Dynamic size based on distance from mouse
    const maxDistanceForSizing = 150;
    const distanceEffect = Math.max(0, 1 - (distance / maxDistanceForSizing));
    obj.radius = obj.baseRadius + (distanceEffect * 0.5);

    // Pulsing effect for attracted particles
    obj.pulsePhase += 0.15;
    const pulseEffect = Math.sin(obj.pulsePhase) * 0.1 + 1;

    // Default falling color with velocity-based variation
    obj.r = Math.floor(baseR - normalizedVelocity * 50);
    obj.g = Math.floor(baseG - normalizedVelocity * 30);
    obj.b = Math.floor(baseB + normalizedVelocity * 50);
    obj.a = 0.7 + normalizedVelocity * 0.2;

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
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        newVx += normalizedDx * attractionForce;
        newVy += normalizedDy * attractionForce;

        const intensity = 1 - (distance / attractionRadius);
        // Enhanced pulsing effect for attracted particles
        obj.radius = obj.baseRadius * pulseEffect + (distanceEffect * 0.5);
        
        obj.r = Math.floor(baseR - normalizedVelocity * 30);
        obj.g = Math.floor(baseG * intensity + normalizedVelocity * 40);
        obj.b = Math.floor(baseB + (255 - baseB) * intensity + normalizedVelocity * 60);
        obj.a = 0.9 + normalizedVelocity * 0.1;
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

  objects.sort((a, b) => a.x - b.x);

  grid.clear();

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
  
  self.postMessage({ 
    type: 'render', 
    particles: dataBuffer, 
  }, [dataBuffer]);
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      canvasWidth = payload.width;
      canvasHeight = payload.height;

      const particleDensity = 1 / 400; // 1 particle per 400 pixels^2
      const calculatedObjects = Math.floor(canvasWidth * canvasHeight * particleDensity);
      NUM_OBJECTS = Math.max(500, Math.min(calculatedObjects, 4000)); // Reduced max for performance

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