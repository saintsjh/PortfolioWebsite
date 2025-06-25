/**
 * @file This file contains the core logic for the "secret" physics simulation,
 * encapsulated in a custom React hook.
 */
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { HomeContentItem } from '@/app/home-content';
import { FlyingContentObject, PhysicsState } from '@/types';

/**
 * A custom hook to manage the state and logic of the secret physics simulation.
 * 
 * This hook handles the physics for flying content objects, including their
 * position, velocity, rotation, and interaction with the user's cursor.
 * 
 * @param content The structured content to be rendered as flying objects.
 * @returns An object containing the simulation state and control functions.
 */
export const useSecretPhysics = (content: HomeContentItem[]) => {
  /** The array of all flying content objects in the simulation. */
  const [objects, setObjects] = useState<FlyingContentObject[]>([]);
  /** The current state of the physics simulation (e.g., 'measuring', 'active'). */
  const [physicsState, setPhysicsState] = useState<PhysicsState>('measuring');
  /** A ref to the hidden blueprint container used for measuring initial layout. */
  const layoutRef = useRef<HTMLDivElement>(null);
  /** The last known position of the user's mouse or touch input. */
  const mousePos = useRef({ x: 0, y: 0 });
  /** The ID of the current animation frame request. */
  const animationFrameId = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (physicsState !== 'measuring' || !layoutRef.current) return;

    const measuredObjects: FlyingContentObject[] = [];
    const parentRect = (layoutRef.current.parentElement as HTMLElement).getBoundingClientRect();

    content.forEach((contentItem, i) => {
        const element = layoutRef.current!.querySelector(`[data-id='${i}']`);
        if (element) {
            const rect = element.getBoundingClientRect();
            const homeX = rect.left - parentRect.left;
            const homeY = rect.top - parentRect.top;
            measuredObjects.push({
                id: i,
                x: homeX,
                y: homeY,
                vx: 0,
                vy: 0,
                homeX,
                homeY,
                rotation: 0,
                angularVelocity: 0,
                content: contentItem,
            });
        }
    });
    
    setObjects(measuredObjects);
    setPhysicsState('settled');
  }, [content, physicsState]);

  const activatePhysics = () => {
    setObjects(prevObjects => prevObjects.map(obj => ({
        ...obj,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        rotation: Math.random() * 360,
        angularVelocity: (Math.random() - 0.5) * 20,
    })));
    setPhysicsState('active');
  };

  const stopPhysics = () => {
    setPhysicsState('settling');
  };

  useEffect(() => {
    if (physicsState !== 'active' && physicsState !== 'settling') return;

    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        event.preventDefault();
        mousePos.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        mousePos.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchstart', handleTouchStart);

    const animate = () => {
      if (physicsState === 'active') {
        setObjects((prevObjects) =>
          prevObjects.map((obj) => {
            const homeDx = obj.homeX - obj.x;
            const homeDy = obj.homeY - obj.y;
            const ax_home = homeDx * 0.001;

            const ay_home = homeDy * 0.001;

            const cursorDx = mousePos.current.x - obj.x;
            const cursorDy = mousePos.current.y - obj.y;
            const cursorDist = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy) || 1;
            const cursorForce = Math.max(0, 1 - cursorDist / 600);
            const ax_cursor = (cursorDx / cursorDist) * cursorForce * 2.0;
            const ay_cursor = (cursorDy / cursorDist) * cursorForce * 2.0;
            
            const newVx = (obj.vx + ax_home + ax_cursor) * 0.92;
            const newVy = (obj.vy + ay_home + ay_cursor) * 0.92;
            const newX = obj.x + newVx;
            const newY = obj.y + newVy;
            
            const targetAngle = Math.atan2(newVy, newVx) * (180 / Math.PI);
            let angleDifference = targetAngle - obj.rotation;
            while (angleDifference < -180) angleDifference += 360;
            while (angleDifference > 180) angleDifference -= 360;
            const torque = angleDifference * 0.1;
            const newAngularVelocity = (obj.angularVelocity + torque) * 0.92;

            return {
              ...obj,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
              rotation: obj.rotation + newAngularVelocity,
              angularVelocity: newAngularVelocity,
            };
          })
        );
      } else if (physicsState === 'settling') {
        setObjects(prevObjects => {
          let allSettled = true;
          const newObjects = prevObjects.map(obj => {
              const homingStrength = 0.1;
              const damping = 0.9;
              const newVx = (obj.vx + (obj.homeX - obj.x) * homingStrength) * damping;
              const newVy = (obj.vy + (obj.homeY - obj.y) * homingStrength) * damping;
              const newX = obj.x + newVx;
              const newY = obj.y + newVy;

              let angleDifference = 0 - obj.rotation;
              while (angleDifference < -180) angleDifference += 360;
              while (angleDifference > 180) angleDifference -= 360;
              const torque = angleDifference * 0.2;
              const newAngularVelocity = (obj.angularVelocity + torque) * 0.8;

              const dist = Math.sqrt(Math.pow(newX - obj.homeX, 2) + Math.pow(newY - obj.homeY, 2));
              const speed = Math.sqrt(newVx * newVx + newVy * newVy);
              if (dist > 1 || speed > 1) {
                  allSettled = false;
              }

              return { ...obj, x: newX, y: newY, vx: newVx, vy: newVy, rotation: obj.rotation + newAngularVelocity, angularVelocity: newAngularVelocity };
          });

          if (allSettled) {
              setTimeout(() => {
                  setObjects(prev => prev.map(o => ({
                      ...o,
                      x: o.homeX, y: o.homeY, vx: 0, vy: 0, rotation: 0, angularVelocity: 0,
                  })));
                  setPhysicsState('settled');
              }, 0);
          }
          return newObjects;
        });
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [physicsState]);

  return {
    objects,
    physicsState,
    layoutRef,
    activatePhysics,
    stopPhysics,
  };
}; 