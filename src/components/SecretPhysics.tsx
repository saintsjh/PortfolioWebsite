'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import { HomeContentItem } from '@/app/home-content';
import TypingEffect from './TypingEffect';

// The state now includes home coordinates and velocity
interface FlyingContentObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  rotation: number;
  angularVelocity: number;
  content: HomeContentItem;
}

interface SecretPhysicsProps {
  content: HomeContentItem[];
}

const SecretPhysics: React.FC<SecretPhysicsProps> = ({ content }) => {
  const [objects, setObjects] = useState<FlyingContentObject[]>([]);
  const [physicsState, setPhysicsState] = useState<'measuring' | 'settled' | 'active' | 'settling'>('measuring');
  const layoutRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  // Phase 1: Measure the layout to find the "home" position of each element
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


  // Phase 2: Run the animation after initialization
  useEffect(() => {
    if (physicsState !== 'active' && physicsState !== 'settling') return;

    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (physicsState === 'active') {
        setObjects((prevObjects) =>
          prevObjects.map((obj) => {
            // --- Homing Force ---
            const homeDx = obj.homeX - obj.x;
            const homeDy = obj.homeY - obj.y;
            const ax_home = homeDx * 0.001; // Spring constant

            const ay_home = homeDy * 0.001;

            // --- Cursor Force ---
            const cursorDx = mousePos.current.x - obj.x;
            const cursorDy = mousePos.current.y - obj.y;
            const cursorDist = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy) || 1;
            const cursorForce = Math.max(0, 1 - cursorDist / 600); // Influence radius
            const ax_cursor = (cursorDx / cursorDist) * cursorForce * 2.0; // Increased cursor strength
            const ay_cursor = (cursorDy / cursorDist) * cursorForce * 2.0; // Increased cursor strength
            
            // --- Update Velocity & Position ---
            const newVx = (obj.vx + ax_home + ax_cursor) * 0.92; // Damping
            const newVy = (obj.vy + ay_home + ay_cursor) * 0.92;
            const newX = obj.x + newVx;
            const newY = obj.y + newVy;
            
            // --- Rotational Physics ---
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
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [physicsState]);

  // Render invisibly first to measure, then render the animation
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {physicsState === 'settled' && (
          <button onClick={activatePhysics} className="activate-button">
              Activate Secret Physics
          </button>
      )}
      {physicsState === 'active' && (
          <button onClick={stopPhysics} className="stop-button">
              Stop Physics
          </button>
      )}

      {/* The animated objects, visible only after initialization */}
      <div style={{ position: 'relative', width: '100%', height: '100%', opacity: physicsState !== 'measuring' ? 1 : 0 }}>
        {objects.map((obj) => (
          <RenderedContent key={obj.id} object={obj} />
        ))}
      </div>

      {/* A hidden copy of the content for measurement */}
      <div ref={layoutRef} style={{ position: 'absolute', top: 0, left: 0, opacity: 0, zIndex: -1, pointerEvents: 'none' }}>
        <div className="main-content-container">
          <div className="text-content">
            {content.map((item, index) => (
              item.type !== 'image' && <StaticContent key={index} item={item} data-id={index} />
            ))}
          </div>
          <div className="image-content">
            {content.map((item, index) => (
              item.type === 'image' && <StaticContent key={index} item={item} data-id={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// A sub-component to render the final, animated content
const RenderedContent: React.FC<{object: FlyingContentObject}> = ({object}) => {
    const style = {
        position: 'absolute' as const,
        left: `${object.x}px`,
        top: `${object.y}px`,
        width: 'fit-content',
        transform: `rotate(${object.rotation}deg)`,
    };
    return <div style={style}><StaticContent item={object.content}/></div>;
}

// A sub-component that renders the content for both measurement and final display
const StaticContent: React.FC<{item: HomeContentItem, "data-id"?: number}> = ({item, "data-id": dataId}) => {
    if (item.type === 'section') {
      const body = item.body;
      return (
        <div className="content-section" data-id={dataId} style={{display: 'flex', alignItems:'baseline', gap: '2rem'}}>
          <div className="section-heading" style={{flex: '0 0 100px', textAlign: 'right', fontWeight: 700}}>{item.heading}</div>
          <div className="section-body">
            {body.type === 'heading' && <h1 className="main-heading"><TypingEffect text={body.text} /></h1>}
            {body.type === 'paragraph' && <p><TypingEffect text={body.text + " " + "Also fun things!"} /></p>}
          </div>
        </div>
      );
    }

    if (item.type === 'listItem') {
        return (
            <div className="content-section" data-id={dataId} style={{display: 'flex', alignItems:'baseline', gap: '2rem'}}>
                <div className="section-heading" style={{flex: '0 0 100px', textAlign: 'right', fontWeight: 700}}>{item.heading}</div>
                <div className="list-item"><TypingEffect text={item.text} /></div>
            </div>
        );
    }

    if (item.type === 'image') {
      return (
        <div className="image-content" data-id={dataId}>
          <Image className="profile-image" src={item.src} alt={item.alt} width={200} height={200} />
        </div>
      );
    }

    return null;
}

export default SecretPhysics; 