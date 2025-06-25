/**
 * @file This file defines the main component for the character physics simulation page.
 * It integrates the custom physics hook and renders the different elements of the simulation.
 */
'use client';

import { useCharacterPhysics } from '@/hooks/useCharacterPhysics';
import Image from 'next/image';
import { HomeContentItem } from '@/app/home-content';
import RenderedObject from './character-physics/RenderedObject';
import BlueprintRenderer from './character-physics/BlueprintRenderer';

interface CharacterPhysicsProps {
  /** The structured content to be deconstructed and rendered as physics objects. */
  content: HomeContentItem[];
}

/**
 * A React component that orchestrates the character physics simulation.
 * 
 * This component handles the rendering of the simulation, including the
 * interactive physics objects, the static UI elements (buttons, image),
 * and the hidden blueprint for initial layout measurement. The core logic
 * is delegated to the `useCharacterPhysics` hook.
 * 
 * @param {CharacterPhysicsProps} props The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
const CharacterPhysics: React.FC<CharacterPhysicsProps> = ({ content }) => {
  const {
    objects,
    physicsState,
    showInteractionHint,
    layoutRef,
    containerRef,
    isMobile,
    randomHello,
    activatePhysics,
    stopPhysics,
    imageItem
  } = useCharacterPhysics(content);

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

export default CharacterPhysics; 