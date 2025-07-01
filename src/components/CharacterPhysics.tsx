'use client';

import { useCharacterPhysics } from '@/hooks/useCharacterPhysics';
import Image from 'next/image';
import { HomeContentItem } from '@/app/home-content';
import RenderedObject from './character-physics/RenderedObject';
import BlueprintRenderer from './character-physics/BlueprintRenderer';

interface CharacterPhysicsProps {
  content: HomeContentItem[];
}


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

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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
      
      <div className="main-content-container" style={{ pointerEvents: 'none' }}>
        <div className="text-content"></div>

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

      {physicsState === 'settled' && (
        <button onClick={activatePhysics} className="activate-button">
          Activate Physics
        </button>
      )}

      {physicsState === 'active' && (
        <button onClick={stopPhysics} className="stop-button">
          Stop Physics
        </button>
      )}

      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        {objects.map(obj => {
          if (obj.content.type === 'char' && obj.content.char === '\n') {
            return null;
          }
          return <RenderedObject key={obj.id} object={obj} />;
        })}
      </div>
        
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