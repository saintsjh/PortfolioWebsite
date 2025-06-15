'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { HomeContentItem } from '@/app/home-content';

// --- TYPE DEFINITIONS ---

// The atomic unit: a single character or a single image.
type DeconstructedItem =
  | { type: 'char'; char: string; style: 'heading' | 'paragraph' | 'link' }
  | { type: 'image'; src: string; alt: string };

// The state for each individual physics object.
interface PhysicsObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  rotation: number;
  angularVelocity: number;
  mass: number;
  radius: number;
  content: DeconstructedItem;
}

interface CharacterPhysicsProps {
  content: HomeContentItem[];
}

// --- UTILITY FUNCTION ---

// Deconstructs the page content into a flat list of characters and images.
const deconstructContent = (content: HomeContentItem[]): DeconstructedItem[] => {
  const deconstructed: DeconstructedItem[] = [];
  content.forEach(item => {
    if (item.type === 'section') {
      const style = item.body.type === 'heading' ? 'heading' : 'paragraph';
      if (item.body.type === 'heading') {
        item.body.text.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style });
        });
      } else if (item.body.type === 'paragraph') {
        const { text, text2, text3 } = item.body;
        text.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
        if (text2) {
          text2.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
        }
        if (text3) {
          text3.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
        }
      }
    } else if (item.type === 'listItem') {
      item.text.split('').forEach(char => {
        deconstructed.push({ type: 'char', char, style: 'link' });
      });
    } 
    // The image is no longer deconstructed into a physics object
  });
  return deconstructed;
};

// --- THE MAIN COMPONENT ---

const CharacterPhysics: React.FC<CharacterPhysicsProps> = ({ content }) => {
  const [objects, setObjects] = useState<PhysicsObject[]>([]);
  const [physicsState, setPhysicsState] = useState<'measuring' | 'settled' | 'active' | 'settling'>('measuring');
  const layoutRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  // Extract the image from the content to be rendered separately.
  const imageItem = content.find(item => item.type === 'image');

  // Memoize the deconstructed content to avoid re-computation.
  const deconstructed = useRef(deconstructContent(content)).current;

  // Phase 1: Measure the layout, then set the state to 'settled'.
  useLayoutEffect(() => {
    if (physicsState !== 'measuring') return;

    // Wait for fonts and give a minimal delay for any final CSS layout shifts.
    document.fonts.ready.then(() => {
      setTimeout(() => {
        if (!layoutRef.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const measuredObjects: PhysicsObject[] = [];
        const elements = layoutRef.current.querySelectorAll('[data-id]');

        elements.forEach(element => {
          const id = parseInt(element.getAttribute('data-id')!, 10);
          const rect = element.getBoundingClientRect();
          
          // CRITICAL FIX: Convert absolute viewport coordinates to coordinates relative to this component.
          const homeX = rect.left - containerRect.left;
          const homeY = rect.top - containerRect.top;

          measuredObjects.push({
            id: id,
            x: homeX, // Start in the correct relative position
            y: homeY,
            vx: 0,
            vy: 0,
            homeX: homeX,
            homeY: homeY,
            rotation: 0,
            angularVelocity: 0,
            mass: 1,
            radius: 8,
            content: deconstructed[id],
          });
        });
        
        setObjects(measuredObjects);
        setPhysicsState('settled');
      }, 50); // 50ms safeguard for layout stability
    });
  }, [deconstructed, physicsState]);


  // Phase 2: Run the animation loop.
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (physicsState === 'active') { // Only run simulation if active
        setObjects(prevObjects => {
          let newObjects: PhysicsObject[] = JSON.parse(JSON.stringify(prevObjects));
          
          const subSteps = 5; // --- SUB-STEPPING to prevent tunneling ---
          const dt = 1 / subSteps;

          for (let step = 0; step < subSteps; step++) {
            
            // --- 1. Solve Collisions with Impulse Resolution (Character vs. Character) ---
            for (let i = 0; i < newObjects.length; i++) {
              for (let j = i + 1; j < newObjects.length; j++) {
                const objA = newObjects[i];
                const objB = newObjects[j];
                const dx = objB.x - objA.x;
                const dy = objB.y - objA.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const totalRadius = objA.radius + objB.radius;

                if (distance < totalRadius) {
                  // Resolve Overlap based on mass
                  const overlap = totalRadius - distance;
                  const totalMass = objA.mass + objB.mass;
                  const overlapX = (dx / distance) * overlap;
                  const overlapY = (dy / distance) * overlap;
                  objA.x -= overlapX * (objB.mass / totalMass);
                  objA.y -= overlapY * (objB.mass / totalMass);
                  objB.x += overlapX * (objA.mass / totalMass);
                  objB.y += overlapY * (objA.mass / totalMass);

                  // Resolve Velocities (Impulse)
                  const normalX = dx / distance;
                  const normalY = dy / distance;
                  const relativeVelX = objB.vx - objA.vx;
                  const relativeVelY = objB.vy - objA.vy;
                  const impulseDot = relativeVelX * normalX + relativeVelY * normalY;
                  const impulse = (2 * impulseDot) / (1 / objA.mass + 1 / objB.mass);
                  
                  const restitution = 0.7; // Bounciness
                  objA.vx += impulse * normalX / objA.mass * restitution;
                  objA.vy += impulse * normalY / objA.mass * restitution;
                  objB.vx -= impulse * normalX / objB.mass * restitution;
                  objB.vy -= impulse * normalY / objB.mass * restitution;
                }
              }
            }

            // --- 2. Update each object's state based on all forces ---
            for (const obj of newObjects) {
              // Calculate cursor influence (0 to 1)
              const cursorDx = mousePos.current.x - obj.x;
              const cursorDy = mousePos.current.y - obj.y;
              const cursorDist = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy) || 1;
              const cursorForce = Math.max(0, 1 - cursorDist / 400);

              // Determine forces based on cursor proximity
              const homingStrength = 0.001 + (1 - cursorForce) * 0.02;
              const damping = 0.98 - (1 - cursorForce) * 0.25;
              const gravity = cursorForce > 0.1 ? 0.2 : 0;
              
              // Apply forces to velocity
              obj.vx += (obj.homeX - obj.x) * homingStrength * dt;
              obj.vy += (obj.homeY - obj.y) * homingStrength * dt;
              obj.vx += (cursorDx / cursorDist) * cursorForce * (5 / obj.mass) * dt;
              obj.vy += (cursorDy / cursorDist) * cursorForce * (5 / obj.mass) * dt;
              obj.vy += gravity * dt;

              // Apply damping
              obj.vx *= damping;
              obj.vy *= damping;

              // Update Position and handle boundaries
              obj.x += obj.vx * dt;
              obj.y += obj.vy * dt;
              const boundaryPadding = obj.radius;
              // Constrain text to the left side (approximately 75% of screen width to match homepage layout)
              const maxTextWidth = window.innerWidth * 0.75;
              if (obj.x < boundaryPadding) { obj.x = boundaryPadding; obj.vx *= -0.5; }
              if (obj.x > maxTextWidth - boundaryPadding) { obj.x = maxTextWidth - boundaryPadding; obj.vx *= -0.5; }
              if (obj.y < boundaryPadding) { obj.y = boundaryPadding; obj.vy *= -0.5; }
              if (obj.y > window.innerHeight - boundaryPadding) { obj.y = window.innerHeight - boundaryPadding; obj.vy *= -0.5; }

              // Update Rotation
              const targetAngle = Math.atan2(obj.vy, obj.vx) * (180 / Math.PI) + 90;
              let angleDifference = targetAngle - obj.rotation;
              while (angleDifference < -180) angleDifference += 360;
              while (angleDifference > 180) angleDifference -= 360;
              const torque = angleDifference * 0.1;
              obj.angularVelocity = (obj.angularVelocity + torque) * 0.92;
              obj.rotation += obj.angularVelocity * dt;
            }
          }
          return newObjects;
        });
      } else if (physicsState === 'settling') {
        setObjects(prevObjects => {
          let newObjects: PhysicsObject[] = JSON.parse(JSON.stringify(prevObjects));
          let allSettled = true;

          for (const obj of newObjects) {
            const homingStrength = 0.1; // Aggressive homing
            const damping = 0.9; // Strong damping

            obj.vx += (obj.homeX - obj.x) * homingStrength;
            obj.vy += (obj.homeY - obj.y) * homingStrength;
            obj.vx *= damping;
            obj.vy *= damping;
            obj.x += obj.vx;
            obj.y += obj.vy;

            // Settle rotation
            let angleDifference = 0 - obj.rotation;
            while (angleDifference < -180) angleDifference += 360;
            while (angleDifference > 180) angleDifference -= 360;
            const torque = angleDifference * 0.2;
            obj.angularVelocity = (obj.angularVelocity + torque) * 0.8;
            obj.rotation += obj.angularVelocity;

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
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [physicsState]); // Rerun effect if state changes


  const activatePhysics = () => {
    // By simply setting the state to 'active', we allow the existing animation
    // loop to take over. The characters will start reacting to the mouse
    // from their settled positions without an initial explosive force.
    setPhysicsState('active');
  };

  const stopPhysics = () => {
    setPhysicsState('settling');
  };

  // The final render
  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* The main layout container, used ONLY to position the static image */}
      <div className="main-content-container" style={{ pointerEvents: 'none' }}>
        {/* This div is empty but necessary for the flexbox layout to push the image to the right */}
        <div className="text-content"></div>

        {/* The static image, which is visible in ALL states except 'measuring' */}
        <div className="image-content">
          {imageItem && imageItem.type === 'image' && (
            <img
              className="profile-image"
              src={imageItem.src}
              alt={imageItem.alt}
              style={{ opacity: physicsState !== 'measuring' ? 1 : 0, transition: 'opacity 0.5s' }}
            />
          )}
        </div>
      </div>

      {/* Render the Activate button only when settled */}
      {physicsState === 'settled' && (
        <button onClick={activatePhysics} className="activate-button">
          Activate Physics
        </button>
      )}

      {/* Render the Stop button only when active */}
      {physicsState === 'active' && (
        <button onClick={stopPhysics} className="stop-button">
          Stop Physics
        </button>
      )}

      {/* The animated characters, rendered in an overlay.
          They will appear once the state is 'settled' because the 'objects' array will be populated.
          In the 'settled' state, their x/y will match their homeX/homeY, so they look like static text.
      */}
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        {objects.map(obj => <RenderedObject key={obj.id} object={obj} />)}
      </div>

      {/* Hidden blueprint for measurement */}
      {physicsState === 'measuring' && (
        <div 
          ref={layoutRef} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            opacity: 0, 
            zIndex: -1, 
            pointerEvents: 'none' 
          }}
        >
          <BlueprintRenderer content={content} />
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS for rendering ---

const RenderedObject: React.FC<{ object: PhysicsObject }> = ({ object }) => {
  const style = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    transform: `translate(${object.x}px, ${object.y}px) rotate(${object.rotation}deg)`,
    color: 'var(--ayu-fg)',
    minWidth: object.content.type === 'char' && object.content.char === ' ' ? '0.25rem' : 'auto',
    display: 'inline-block',
  };
  
  if (object.content.type === 'char') {
    let className = 'physics-character';
    if (object.content.style === 'heading') className = 'physics-character main-heading';
    if (object.content.style === 'link') className = 'physics-character list-item';
    return <span style={style} className={className}>{object.content.char}</span>;
  }

  return null;
};

const BlueprintRenderer: React.FC<{ content: HomeContentItem[] }> = ({ content }) => {
  let charIndex = 0;
  const imageItem = content.find(item => item.type === 'image');

  return (
    <div className="main-content-container">
      <div className="text-content">
        {/* Render Sections with character spans for measurement */}
        {content.map((item, index) => {
          if (item.type === 'section') {
            return (
              <div className="content-section" key={`section-${index}`}>
                <div className="section-body">
                  {item.body.type === 'heading' && <h1 className="main-heading">{item.body.text.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</h1>}
                  {item.body.type === 'paragraph' && (
                    <>
                      <p>{item.body.text.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>
                      {item.body.text2 && <p style={{ marginTop: '1rem' }}>{item.body.text2.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                      {item.body.text3 && <p style={{ marginTop: '1rem' }}>{item.body.text3.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                    </>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
        {/* Render List with character spans for measurement */}
        <div className="content-section">
          <div className="section-body">
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, marginTop: '2rem' }}>
              {content.map((item, index) => {
                if (item.type === 'listItem') {
                  return (
                    <li className="list-item" key={index} style={{ marginBottom: '0.5rem' }}>
                      {item.text.split('').map(char => (
                        <span key={charIndex} data-id={charIndex++}>{char}</span>
                      ))}
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </div>
        </div>
      </div>
      {/* Render the static image in the blueprint to ensure correct text flow */}
      <div className="image-content">
        {imageItem && imageItem.type === 'image' &&
            <img className="profile-image" src={imageItem.src} alt={imageItem.alt}/>
        }
      </div>
    </div>
  );
};

export default CharacterPhysics; 