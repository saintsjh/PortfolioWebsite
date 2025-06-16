'use client';

import { useState, useEffect, useRef } from 'react';

interface FlyingObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
}

const NUM_OBJECTS = 1150;

const PhysicsCanvas = () => {
  const [objects, setObjects] = useState<FlyingObject[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    console.log('[PhysicsCanvas] Component mounted: Initializing animation.');

    // Initialize objects with velocity and physics properties
    setObjects(
      Array.from({ length: NUM_OBJECTS }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2, // Random initial velocity
        vy: (Math.random() - 0.5) * 2,
        radius: 5, // Collision radius
        mass: 1, // Mass for physics calculations
        color: 'default',
      }))
    );
    console.log(`[PhysicsCanvas] Created ${NUM_OBJECTS} objects.`);

    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      setObjects((prevObjects) => {
        let newObjects = [...prevObjects];

        // Apply mouse attraction and update positions
        newObjects = newObjects.map((obj) => {
          const dx = mousePos.current.x - obj.x;
          const dy = mousePos.current.y - obj.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDx = dx / distance || 0;
          const normalizedDy = dy / distance || 0;
          
          let newVx = obj.vx;
          let newVy = obj.vy;
          let objectColor = 'rgba(255, 255, 255, 0.8)'; // Default white/transparent
          
          // Mouse attraction force (only when within radius)
          const attractionRadius = 200;
          if (distance < attractionRadius) {
            const attractionForce = 0.3;
            newVx += normalizedDx * attractionForce;
            newVy += normalizedDy * attractionForce;
            
            // Calculate red intensity based on distance (closer = more red)
            const intensity = 1 - (distance / attractionRadius);
            const redValue = Math.floor(255 * intensity);
            const otherValues = Math.floor(255 * (1 - intensity * 0.8)); // Keep some white/blue
            objectColor = `rgba(${redValue}, ${otherValues}, ${otherValues}, 0.9)`;
          } else {
            // Apply gravity when outside cursor influence
            const gravity = 0.2;
            newVy += gravity;
            objectColor = 'rgba(200, 200, 255, 0.7)'; // Light blue when falling
          }
          
          // Apply damping to prevent infinite acceleration
          const damping = 0.99;
          const dampedVx = newVx * damping;
          const dampedVy = newVy * damping;
          
          // Update position
          let newX = obj.x + dampedVx;
          let newY = obj.y + dampedVy;
          let finalVx = dampedVx;
          let finalVy = dampedVy;
          
          // Boundary collision with velocity reflection
          if (newX < obj.radius) {
            newX = obj.radius;
            finalVx = -finalVx * 0.8; // Bounce with some energy loss
          } else if (newX > window.innerWidth - obj.radius) {
            newX = window.innerWidth - obj.radius;
            finalVx = -finalVx * 0.8;
          }
          
          if (newY < obj.radius) {
            newY = obj.radius;
            finalVy = -finalVy * 0.8;
          } else if (newY > (window.innerHeight * 0.85) - obj.radius) {
            newY = (window.innerHeight * 0.85) - obj.radius;
            finalVy = -finalVy * 0.8; // Bounce off bottom
          }
          
          return {
            ...obj,
            x: newX,
            y: newY,
            vx: finalVx,
            vy: finalVy,
            color: objectColor,
          };
        });

        // Collision detection and response
        for (let i = 0; i < newObjects.length; i++) {
          for (let j = i + 1; j < newObjects.length; j++) {
            const objA = newObjects[i];
            const objB = newObjects[j];
            
            const dx = objB.x - objA.x;
            const dy = objB.y - objA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = objA.radius + objB.radius;
            
            if (distance < minDistance && distance > 0) {
              // Collision detected - resolve overlap and velocities
              
              // Normalize collision vector
              const nx = dx / distance;
              const ny = dy / distance;
              
              // Separate objects to prevent overlap
              const overlap = minDistance - distance;
              const separationX = (overlap / 2) * nx;
              const separationY = (overlap / 2) * ny;
              
              objA.x -= separationX;
              objA.y -= separationY;
              objB.x += separationX;
              objB.y += separationY;
              
              // Calculate relative velocity
              const relativeVelX = objB.vx - objA.vx;
              const relativeVelY = objB.vy - objA.vy;
              
              // Calculate relative velocity along collision normal
              const velAlongNormal = relativeVelX * nx + relativeVelY * ny;
              
              // Don't resolve if velocities are separating
              if (velAlongNormal > 0) continue;
              
              // Calculate restitution (bounciness)
              const restitution = 0.8;
              
              // Calculate impulse scalar
              const impulse = -(1 + restitution) * velAlongNormal;
              const totalMass = objA.mass + objB.mass;
              const impulseScalar = impulse / totalMass;
              
              // Apply impulse to velocities
              objA.vx -= impulseScalar * objB.mass * nx;
              objA.vy -= impulseScalar * objB.mass * ny;
              objB.vx += impulseScalar * objA.mass * nx;
              objB.vy += impulseScalar * objA.mass * ny;
            }
          }
        }

        return newObjects;
      });
      
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      console.log('[PhysicsCanvas] Component unmounted: Cleaning up animation.');
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        console.log('[PhysicsCanvas] Animation frame successfully cancelled.');
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
      {objects.map((obj) => (
        <div
          key={obj.id}
          className="flying-object"
          style={{
            left: `${obj.x - obj.radius}px`,
            top: `${obj.y - obj.radius}px`,
            width: `${obj.radius * 2}px`,
            height: `${obj.radius * 2}px`,
            backgroundColor: obj.color,
          }}
        />
      ))}
    </div>
  );
};

export default PhysicsCanvas; 