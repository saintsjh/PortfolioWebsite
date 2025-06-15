'use client';

import { useState, useEffect, useRef } from 'react';

interface FlyingObject {
  id: number;
  x: number;
  y: number;
  speed: number;
}

const NUM_OBJECTS = 150;

const PhysicsCanvas = () => {
  const [objects, setObjects] = useState<FlyingObject[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    console.log('[PhysicsCanvas] Component mounted: Initializing animation.');

    // Initialize objects
    setObjects(
      Array.from({ length: NUM_OBJECTS }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 2 + Math.random() * 8, // Random speed
      }))
    );
    console.log(`[PhysicsCanvas] Created ${NUM_OBJECTS} objects.`);

    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      setObjects((prevObjects) =>
        prevObjects.map((obj) => {
          const dx = mousePos.current.x - obj.x;
          const dy = mousePos.current.y - obj.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDx = dx / distance;
          const normalizedDy = dy / distance;
          if (distance < 500) {
            return {
              ...obj,
              x: obj.x + normalizedDx * obj.speed,
              y: obj.y + normalizedDy * obj.speed,
            };
          } else {
            return {
              ...obj,
              x: obj.x + normalizedDx * obj.speed * .40,
              y: obj.y + normalizedDy * obj.speed * .40,
            };
          }
        })
      );
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
            left: `${obj.x}px`,
            top: `${obj.y}px`,
          }}
        />
      ))}
    </div>
  );
};

export default PhysicsCanvas; 