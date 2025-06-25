
import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import { HomeContentItem, getRandomGreeting } from '@/app/home-content';
import { deconstructContent } from '@/utils/contentUtils';
import { PhysicsObject, PhysicsState } from '@/types';


export const useCharacterPhysics = (content: HomeContentItem[]) => {
  const [objects, setObjects] = useState<PhysicsObject[]>([]);
  const [physicsState, setPhysicsState] = useState<PhysicsState>('measuring');
  const [hasActivatedOnce, setHasActivatedOnce] = useState(false);
  const [showInteractionHint, setShowInteractionHint] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);
  const physicsStateRef = useRef(physicsState);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const [isMounted, setIsMounted] = useState(false);
  const [randomHello, setRandomHello] = useState('');

  useEffect(() => {
    physicsStateRef.current = physicsState;
  }, [physicsState]);

  useEffect(() => {
    setIsMounted(true);
    setRandomHello(getRandomGreeting());
  }, []);

  const deconstructed = useMemo(() => {
    if (!isMounted || !randomHello) return [];
    return deconstructContent(content, randomHello, isMobile);
  }, [isMounted, content, randomHello, isMobile]);

  useLayoutEffect(() => {
    if (physicsState !== 'measuring' || deconstructed.length === 0) return;

    document.fonts.ready.then(() => {
      setTimeout(() => {
        if (!layoutRef.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const measuredObjects: PhysicsObject[] = [];
        const elements = layoutRef.current.querySelectorAll('[data-id]');
        const mobileYOffset = isMobile ? 50 : 0;
        const mobileXOffset = isMobile ? 15 : 0;

        elements.forEach(element => {
          const id = parseInt(element.getAttribute('data-id')!, 10);
          const rect = element.getBoundingClientRect();
          
          const homeX = rect.left - containerRect.left + mobileXOffset;
          const homeY = rect.top - containerRect.top + mobileYOffset;

          measuredObjects.push({
            id: id,
            x: homeX,
            y: homeY,
            vx: 0,
            vy: 0,
            homeX: homeX,
            homeY: homeY,
            mass: 1,
            radius: 8,
            content: deconstructed[id],
          });
        });
        
        setObjects(measuredObjects);
        setPhysicsState('settled');
      }, 50);
    });
  }, [deconstructed, physicsState, isMobile]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePos.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (physicsStateRef.current === 'active' && event.touches.length > 0) {
        event.preventDefault();
        const rect = container.getBoundingClientRect();
        mousePos.current = { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const targetElement = event.target as HTMLElement;
      if (physicsStateRef.current === 'active' && targetElement.tagName !== 'BUTTON') {
        event.preventDefault();
      }
      if (event.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        mousePos.current = { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      if (physicsStateRef.current === 'active') {
        setObjects(prevObjects => {
          const newObjects: PhysicsObject[] = prevObjects.map(o => ({ ...o }));
          
          const subSteps = 5;
          const dt = 1 / subSteps;

          for (let step = 0; step < subSteps; step++) {
            for (let i = 0; i < newObjects.length; i++) {
              for (let j = i + 1; j < newObjects.length; j++) {
                const objA = newObjects[i];
                const objB = newObjects[j];
                const dx = objB.x - objA.x;
                const dy = objB.y - objA.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const totalRadius = objA.radius + objB.radius;

                if (distance < totalRadius) {
                  const overlap = totalRadius - distance;
                  const totalMass = objA.mass + objB.mass;
                  const overlapX = (dx / distance) * overlap;
                  const overlapY = (dy / distance) * overlap;
                  objA.x -= overlapX * (objB.mass / totalMass);
                  objA.y -= overlapY * (objB.mass / totalMass);
                  objB.x += overlapX * (objA.mass / totalMass);
                  objB.y += overlapY * (objA.mass / totalMass);

                  const normalX = dx / distance;
                  const normalY = dy / distance;
                  const relativeVelX = objB.vx - objA.vx;
                  const relativeVelY = objB.vy - objA.vy;
                  const impulseDot = relativeVelX * normalX + relativeVelY * normalY;
                  const impulse = (2 * impulseDot) / (1 / objA.mass + 1 / objB.mass);
                  
                  const restitution = 0.7;
                  objA.vx += impulse * normalX / objA.mass * restitution;
                  objA.vy += impulse * normalY / objA.mass * restitution;
                  objB.vx -= impulse * normalX / objB.mass * restitution;
                  objB.vy -= impulse * normalY / objB.mass * restitution;
                }
              }
            }

            for (const obj of newObjects) {
              const cursorDx = mousePos.current.x - obj.x;
              const cursorDy = mousePos.current.y - obj.y;
              const cursorDist = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy) || 1;
              const cursorForce = Math.max(0, 1 - cursorDist / 400);

              const homingStrength = 0.001 + (1 - cursorForce) * 0.02;
              const damping = 0.98 - (1 - cursorForce) * 0.25;
              const gravity = cursorForce > 0.1 ? 0.2 : 0;
              
              obj.vx += (obj.homeX - obj.x) * homingStrength * dt;
              obj.vy += (obj.homeY - obj.y) * homingStrength * dt;
              obj.vx += (cursorDx / cursorDist) * cursorForce * (5 / obj.mass) * dt;
              obj.vy += (cursorDy / cursorDist) * cursorForce * (5 / obj.mass) * dt;
              obj.vy += gravity * dt;

              obj.vx *= damping;
              obj.vy *= damping;

              obj.x += obj.vx * dt;
              obj.y += obj.vy * dt;
              const boundaryPadding = obj.radius;
              const maxTextWidth = isMobile ? window.innerWidth : window.innerWidth * 0.75;
              if (obj.x < boundaryPadding) { obj.x = boundaryPadding; obj.vx *= -0.5; }
              if (obj.x > maxTextWidth - boundaryPadding) { obj.x = maxTextWidth - boundaryPadding; obj.vx *= -0.5; }
              if (obj.y < boundaryPadding) { obj.y = boundaryPadding; obj.vy *= -0.5; }
              if (obj.y > window.innerHeight - boundaryPadding) { obj.y = window.innerHeight - boundaryPadding; obj.vy *= -0.5; }
            }
          }
          return newObjects;
        });
      } else if (physicsStateRef.current === 'settling') {
        setObjects(prevObjects => {
          const newObjects: PhysicsObject[] = prevObjects.map(o => ({ ...o }));
          let allSettled = true;

          for (const obj of newObjects) {
            const homingStrength = 0.1;
            const damping = 0.9;

            obj.vx += (obj.homeX - obj.x) * homingStrength;
            obj.vy += (obj.homeY - obj.y) * homingStrength;
            obj.vx *= damping;
            obj.vy *= damping;
            obj.x += obj.vx;
            obj.y += obj.vy;

            const dist = Math.sqrt(Math.pow(obj.x - obj.homeX, 2) + Math.pow(obj.y - obj.homeY, 2));
            const speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);

            if (dist > 0.5 || speed > 0.5) {
              allSettled = false;
            }
          }

          if (allSettled) {
            setTimeout(() => {
              setObjects(prev => prev.map(o => ({
                ...o,
                x: o.homeX, y: o.homeY, vx: 0, vy: 0,
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
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isMobile]);

  const activatePhysics = () => {
    if (isMobile && !hasActivatedOnce) {
      setShowInteractionHint(true);
      setTimeout(() => setShowInteractionHint(false), 4000);
      setHasActivatedOnce(true);
    }
    setPhysicsState('active');
  };

  const stopPhysics = () => {
    setPhysicsState('settling');
  };

  const imageItem = (isMounted && isMobile) ? '/imgs/logo-gradient-jh.svg' : '/imgs/IMG_2635.jpeg';

  return {
    objects,
    physicsState,
    showInteractionHint,
    layoutRef,
    containerRef,
    isMobile,
    isMounted,
    randomHello,
    activatePhysics,
    stopPhysics,
    imageItem
  };
}; 