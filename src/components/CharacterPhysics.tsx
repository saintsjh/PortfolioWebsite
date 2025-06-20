'use client';

import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import Image from 'next/image';
import { HomeContentItem, getRandomGreeting } from '@/app/home-content';
import { useMediaQuery } from 'react-responsive';

// --- TYPE DEFINITIONS ---

// The atomic unit: a single character or a single image.
type DeconstructedItem =
  | { type: 'char'; char: string; style: 'heading' | 'paragraph' | 'link' | 'number' | 'greeting' | 'section-heading' }
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
  mass: number;
  radius: number;
  content: DeconstructedItem;
}

interface CharacterPhysicsProps {
  content: HomeContentItem[];
}

// --- UTILITY FUNCTION ---

// Deconstructs the page content into a flat list of characters and images.
const deconstructContent = (content: HomeContentItem[], randomHello: string, isMobile: boolean): DeconstructedItem[] => {
  const deconstructed: DeconstructedItem[] = [];
  
  content.forEach(item => {
    if (item.type === 'section') {
      // Add section heading characters if they exist
      if (item.heading && item.heading.trim() !== '') {
        item.heading.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'section-heading' });
        });
      }
      
      const style = item.body.type === 'heading' ? 'heading' : 'paragraph';
      if (item.body.type === 'heading') {
        // Handle the greeting specially - split into greeting and rest
        if (item.body.text.includes('Hello, I am Jesse Herrera')) {
          // Add greeting characters with 'greeting' style
          randomHello.split('').forEach(char => {
            deconstructed.push({ type: 'char', char, style: 'greeting' });
          });
          // Add the rest with 'heading' style
          ', I am Jesse Herrera'.split('').forEach(char => {
            deconstructed.push({ type: 'char', char, style });
          });
        } else {
          item.body.text.split('').forEach(char => {
            deconstructed.push({ type: 'char', char, style });
          });
        }
      } else if (item.body.type === 'paragraph') {
        if (isMobile) {
          const mobileLines = [
            "I have a passion for working with people",
            "and building applications. I have",
            "experience building full stack",
            "applications and mobile apps. Using",
            "technologies like React, Next.js,",
            "Tailwind CSS, TypeScript, .Net, and more."
          ];
          mobileLines.forEach((line, index) => {
            line.split('').forEach(char => deconstructed.push({ type: 'char', char, style: 'paragraph' }));
            if (index < mobileLines.length - 1) {
              deconstructed.push({ type: 'char', char: '\n', style: 'paragraph' });
            }
          });
        } else {
          const { text, text2, text3 } = item.body;
          text.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
          if (text2) {
            text2.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
          }
          if (text3) {
            text3.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
          }
        }
      }
    } else if (item.type === 'listItem') {
      // Add "Projs" heading only once for the first list item
      if (item === content.find(i => i.type === 'listItem')) {
        'Projs'.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'section-heading' });
        });
      }
      
      // Check if text starts with a number pattern (e.g., "00. ")
      const match = item.text.match(/^(\d+\.\s)(.+)$/);
      if (match) {
        const number = match[1];
        const projectName = match[2];
        // Mark number characters as 'number' style
        number.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'number' });
        });
        // Mark project name characters as 'link' style
        projectName.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'link' });
        });
      } else {
        item.text.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'link' });
        });
      }
    } 
    // The image is no longer deconstructed into a physics object
  });
  return deconstructed;
};

// --- THE MAIN COMPONENT ---

const CharacterPhysics: React.FC<CharacterPhysicsProps> = ({ content }) => {
  const [objects, setObjects] = useState<PhysicsObject[]>([]);
  const [physicsState, setPhysicsState] = useState<'measuring' | 'settled' | 'active' | 'settling'>('measuring');
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

  // Extract the image from the content to be rendered separately.
  const imageItem = (isMounted && isMobile) ? '/imgs/logo-gradient-jh.svg' : '/imgs/IMG_2635.jpeg';

  // Memoize the deconstructed content to avoid re-computation.
  // CRITICAL: Only deconstruct AFTER the random greeting is set on the client.
  const deconstructed = useMemo(() => {
    if (!isMounted || !randomHello) return [];
    return deconstructContent(content, randomHello, isMobile);
  }, [isMounted, content, randomHello, isMobile]);

  // Phase 1: Measure the layout, then set the state to 'settled'.
  useLayoutEffect(() => {
    if (physicsState !== 'measuring' || deconstructed.length === 0) return;

    // Wait for fonts and give a minimal delay for any final CSS layout shifts.
    document.fonts.ready.then(() => {
      setTimeout(() => {
        if (!layoutRef.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const measuredObjects: PhysicsObject[] = [];
        const elements = layoutRef.current.querySelectorAll('[data-id]');
        const mobileYOffset = isMobile ? 50 : 0; // Add 50px offset on mobile
        const mobileXOffset = isMobile ? 15 : 0; // Shift right for mobile padding

        elements.forEach(element => {
          const id = parseInt(element.getAttribute('data-id')!, 10);
          const rect = element.getBoundingClientRect();
          
          const homeX = rect.left - containerRect.left + mobileXOffset;
          const homeY = rect.top - containerRect.top + mobileYOffset;

          measuredObjects.push({
            id: id,
            x: homeX, // Start in the correct relative position
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
      }, 50); // 50ms safeguard for layout stability
    });
  }, [deconstructed, physicsState, isMobile]);


  // Set up event listeners for physics interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };

    const handleTouchMove = (event: TouchEvent) => {
      // Only prevent default if physics is active, to stop scrolling the page
      if (physicsStateRef.current === 'active' && event.touches.length > 0) {
        event.preventDefault();
        mousePos.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const targetElement = event.target as HTMLElement;
      // Only prevent default if physics is active AND the user is not touching a button
      if (physicsStateRef.current === 'active' && targetElement.tagName !== 'BUTTON') {
        event.preventDefault();
      }
      if (event.touches.length > 0) {
        mousePos.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
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
  }, []); // Run only once

  // Phase 2: Run the animation loop.
  useEffect(() => {
    const animate = () => {
      if (physicsState === 'active') { // Only run simulation if active
        setObjects(prevObjects => {
          // Use a much faster mapping for the new state array
          const newObjects: PhysicsObject[] = prevObjects.map(o => ({ ...o }));
          
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
              // Constrain text to the left side on desktop, but allow full width on mobile.
              const isMobile = window.innerWidth <= 768;
              const maxTextWidth = isMobile ? window.innerWidth : window.innerWidth * 0.75;
              if (obj.x < boundaryPadding) { obj.x = boundaryPadding; obj.vx *= -0.5; }
              if (obj.x > maxTextWidth - boundaryPadding) { obj.x = maxTextWidth - boundaryPadding; obj.vx *= -0.5; }
              if (obj.y < boundaryPadding) { obj.y = boundaryPadding; obj.vy *= -0.5; }
              if (obj.y > window.innerHeight - boundaryPadding) { obj.y = window.innerHeight - boundaryPadding; obj.vy *= -0.5; }

              // --- ROTATION REMOVED FOR PERFORMANCE ---
            }
          }
          return newObjects;
        });
      } else if (physicsState === 'settling') {
        setObjects(prevObjects => {
          const newObjects: PhysicsObject[] = prevObjects.map(o => ({ ...o }));
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
  }, [physicsState]); // Rerun effect if state changes


  const activatePhysics = () => {
    if (isMobile && !hasActivatedOnce) {
      setShowInteractionHint(true);
      setTimeout(() => setShowInteractionHint(false), 4000); // Hide after 4 seconds
      setHasActivatedOnce(true);
    }
    setPhysicsState('active');
  };

  const stopPhysics = () => {
    setPhysicsState('settling');
  };

  // The final render
  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Mobile interaction hint */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px', // Position above the nav bar
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 15px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          borderRadius: '8px',
          zIndex: 10,
          fontFamily: 'monospace',
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: showInteractionHint ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          whiteSpace: 'nowrap',
        }}
      >
        Touch and drag to interact!
      </div>
      
      {/* The main layout container, used ONLY to position the static image */}
      <div className="main-content-container" style={{ pointerEvents: 'none' }}>
        {/* This div is empty but necessary for the flexbox layout to push the image to the right */}
        <div className="text-content"></div>

        {/* The static image, which is visible in ALL states except 'measuring' */}
        <div className="image-content">
          {imageItem && (
            <Image
              className="profile-image"
              src={imageItem}
              alt="Jesse Herrera"
              width={500}
              height={500}
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
        {objects.map(obj => {
          if (obj.content.type === 'char' && obj.content.char === '\n') {
            return null; // Don't render newline characters as physics objects
          }
          return <RenderedObject key={obj.id} object={obj} />;
        })}
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
          <BlueprintRenderer content={content} randomHello={randomHello} isMobile={isMobile} />
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
    transform: `translate(${object.x}px, ${object.y}px)`,
    color: 'var(--ayu-fg)',
    minWidth: 'auto',
    display: 'inline-block',
  };
  
  if (object.content && object.content.type === 'char') {
    let className = 'physics-character';
    const charStyle: React.CSSProperties = { ...style };
    if (object.content.char === ' ') {
      charStyle.minWidth = '0.3em';
    }
    if (object.content.style === 'heading') className = 'physics-character main-heading';
    if (object.content.style === 'link') className = 'physics-character list-item';
    if (object.content.style === 'number') {
      className = 'physics-character list-item';
      charStyle.color = 'var(--ayu-orange)';
    }
    if (object.content.style === 'greeting') {
      className = 'physics-character main-heading';
      charStyle.color = 'var(--ayu-orange)';
    }
    if (object.content.style === 'section-heading') {
      className = 'physics-character section-heading';
      charStyle.color = 'var(--ayu-orange)';
      charStyle.opacity = 0.7;
    }
    return <span style={charStyle} className={className}>{object.content.char}</span>;
  }

  return null;
};

const BlueprintRenderer: React.FC<{ content: HomeContentItem[], randomHello: string, isMobile: boolean }> = ({ content, randomHello, isMobile }) => {
  let charIndex = 0;
  const imageItem = content.find(item => item.type === 'image');

  return (
    <div className="main-content-container">
      <div className="text-content" style={{ paddingLeft: '6px' }}>
        {/* Render Sections with character spans for measurement */}
        {content.map((item, index) => {
          if (item.type === 'section') {
            return (
              <div className="content-section" key={`section-${index}`}>
                <div className="section-heading">
                  {item.heading && item.heading.trim() !== '' && item.heading.split('').map(char => (
                    <span key={charIndex} data-id={charIndex++}>{char}</span>
                  ))}
                </div>
                <div className="section-body">
                  {item.body.type === 'heading' && (
                    <h1 className="main-heading">
                      {item.body.text.includes('Hello, I am Jesse Herrera') ? (
                        <>
                          {randomHello.split('').map(char => (
                            <span key={charIndex} data-id={charIndex++} style={{ color: 'var(--ayu-orange)' }}>{char}</span>
                          ))}
                          {', I am Jesse Herrera'.split('').map(char => (
                            <span key={charIndex} data-id={charIndex++}>{char}</span>
                          ))}
                        </>
                      ) : (
                        item.body.text.split('').map(char => (
                          <span key={charIndex} data-id={charIndex++}>{char}</span>
                        ))
                      )}
                    </h1>
                  )}
                  {item.body.type === 'paragraph' && (
                    <div className="section-body">
                      {isMobile ? (
                        <div>
                          {"I have a passion for working with people".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"and building applications. I have".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"experience building full stack".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"applications and mobile apps. Using".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"technologies like React, Next.js,".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"Tailwind CSS, TypeScript, .Net, and more.".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                        </div>
                      ) : (
                        <>
                          <p>{item.body.text.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>
                          {item.body.text2 && <p style={{ marginTop: '1rem' }}>{item.body.text2.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                          {item.body.text3 && <p style={{ marginTop: '1rem' }}>{item.body.text3.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
        {/* Render List with character spans for measurement */}
        <div className="content-section">
          <div className="section-heading">
            {'Projs'.split('').map(char => (
              <span key={charIndex} data-id={charIndex++}>{char}</span>
            ))}
          </div>
          <div className="section-body">
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, marginTop: '2rem' }}>
              {content.map((item, index) => {
                if (item.type === 'listItem') {
                  const match = item.text.match(/^(\d+\.\s)(.+)$/);
                  return (
                    <li className="list-item" key={index} style={{ marginBottom: '0.5rem' }}>
                      {match ? (
                        <>
                          {match[1].split('').map(char => (
                            <span key={charIndex} data-id={charIndex++} className="project-number">{char}</span>
                          ))}
                          {match[2].split('').map(char => (
                            <span key={charIndex} data-id={charIndex++}>{char}</span>
                          ))}
                        </>
                      ) : (
                        item.text.split('').map(char => (
                          <span key={charIndex} data-id={charIndex++}>{char}</span>
                        ))
                      )}
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
            <Image className="profile-image" src={imageItem.src} alt={imageItem.alt} width={500} height={500} />
        }
      </div>
    </div>
  );
};

export default CharacterPhysics; 