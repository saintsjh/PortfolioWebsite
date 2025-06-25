
'use client';

import { HomeContentItem } from '@/app/home-content';
import RenderedContent from './secret-physics/RenderedContent';
import StaticContent from './secret-physics/StaticContent';
import { useSecretPhysics } from '@/hooks/useSecretPhysics';

interface SecretPhysicsProps {
  content: HomeContentItem[];
}


const SecretPhysics: React.FC<SecretPhysicsProps> = ({ content }) => {
  const {
    objects,
    physicsState,
    layoutRef,
    activatePhysics,
    stopPhysics,
  } = useSecretPhysics(content);

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

      <div style={{ position: 'relative', width: '100%', height: '100%', opacity: physicsState !== 'measuring' ? 1 : 0 }}>
        {objects.map((obj) => (
          <RenderedContent key={obj.id} object={obj} />
        ))}
      </div>

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