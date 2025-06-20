'use client';

import PhysicsCanvas from "@/components/PhysicsCanvas";
import { useEffect, useRef, useState } from "react";
import NavBar from "@/components/NavBar";

export default function Projects() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [pullStrength, setPullStrength] = useState(0.3);
  const [baseColor, setBaseColor] = useState('#ffd280'); // ayu orange

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseEnter = () => {
      if (glowRef.current) {
        glowRef.current.style.opacity = '1';
      }
    };

    const handleMouseLeave = () => {
      if (glowRef.current) {
        glowRef.current.style.opacity = '0';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div>
      <PhysicsCanvas pullStrength={pullStrength} baseColor={baseColor} />
      <div 
        ref={glowRef}
        className="mouse-glow"
        style={{
          position: 'fixed',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.1) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'opacity 0.3s ease',
          opacity: '0',
        }}
      />
      {/* Physics Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        fontFamily: 'monospace',
      }}>
        <button
          onClick={() => setShowControls(!showControls)}
          style={{
            background: '#2d2d2d',
            color: '#e6e1cf',
            border: '1px solid #565656',
            borderRadius: '4px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ⚙️ Physics
        </button>
        
        {showControls && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            background: '#2d2d2d',
            border: '1px solid #565656',
            borderRadius: '4px',
            padding: '12px',
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                color: '#e6e1cf', 
                fontSize: '11px', 
                marginBottom: '4px' 
              }}>
                Pull Strength: {pullStrength.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={pullStrength}
                onChange={(e) => setPullStrength(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#ffb454',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                color: '#e6e1cf', 
                fontSize: '11px', 
                marginBottom: '4px' 
              }}>
                Base Color
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['#ffd280', '#ffb454', '#ff8f40', '#f07178', '#d4bfff', '#95e6cb'].map(color => (
                  <button
                    key={color}
                    onClick={() => setBaseColor(color)}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: color,
                      border: baseColor === color ? '2px solid #e6e1cf' : '1px solid #565656',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <h1>FUN PAGE</h1>
      <p>Have some cheeky fun.</p>
      <NavBar currentPage="projects" />
    </div>
  );
} 