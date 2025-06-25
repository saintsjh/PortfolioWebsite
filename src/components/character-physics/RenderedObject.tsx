import { PhysicsObject } from '@/types';
import React from 'react';

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

export default RenderedObject; 