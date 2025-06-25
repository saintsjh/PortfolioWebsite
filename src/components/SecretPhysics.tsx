/**
 * @file This file defines the main component for the "secret" physics simulation page.
 * It uses a custom hook to manage a physics simulation where content items fly around.
 */
'use client';

import { HomeContentItem } from '@/app/home-content';
import RenderedContent from './secret-physics/RenderedContent';
import StaticContent from './secret-physics/StaticContent';
import { useSecretPhysics } from '@/hooks/useSecretPhysics';

interface SecretPhysicsProps {
  /** The structured content to be rendered as flying physics objects. */
  content: HomeContentItem[];
}

/**
 * A React component that orchestrates the "secret" flying content physics simulation.
 * 
 * This component renders content items as objects that fly around the screen,
 * interacting with the user's cursor. It uses the `useSecretPhysics` hook to
 * manage all the simulation logic.
 * 
 * @param {SecretPhysicsProps} props The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
const SecretPhysics: React.FC<SecretPhysicsProps> = ({ content }) => {
  const {
    objects,
    physicsState,
    layoutRef,
    activatePhysics,
    stopPhysics,
  } = useSecretPhysics(content);

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

export default SecretPhysics; 