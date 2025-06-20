'use client';

import { useEffect, useRef, useState } from 'react';

// The component no longer needs a specific interface for the objects,
// as it will receive a raw ArrayBuffer.

interface PhysicsCanvasProps {
  pullStrength?: number;
  baseColor?: string;
}

const PhysicsCanvas = ({ pullStrength = 0.3, baseColor = '#ffd280' }: PhysicsCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  // This ref will now store the ArrayBuffers received from the worker.
  const latestParticleBuffer = useRef<ArrayBuffer | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      setHintVisible(true);
      const timer = setTimeout(() => setHintVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) {
      return;
    }

    const worker = new Worker(new URL('../workers/physics.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    // This listener now receives render data with particles.
    worker.onmessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'render') {
        latestParticleBuffer.current = e.data.particles;
      }
    };
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // On the first resize, initialize the worker.
      if (!latestParticleBuffer.current) {
        worker.postMessage({
          type: 'init',
          payload: { width: canvas.width, height: canvas.height },
        });
      } else {
        // On subsequent resizes, just notify the worker of the new dimensions.
        worker.postMessage({
          type: 'resize',
          payload: { width: canvas.width, height: canvas.height },
        });
      }
    };
    resizeCanvas();
    
    const animate = () => {
      // The guard clause now works perfectly. If the refs are null, we wait.
      if (!latestParticleBuffer.current) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      // Take ownership of the buffers for this frame.
      const particleBuffer = latestParticleBuffer.current;
      // Immediately nullify the refs.
      latestParticleBuffer.current = null;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render particles
      const particleData = new Float32Array(particleBuffer);
      const numObjects = particleData.length / 7;
      
      for (let i = 0; i < numObjects; i++) {
        const offset = i * 7;
        const x = particleData[offset];
        const y = particleData[offset + 1];
        const radius = particleData[offset + 2];
        const r = particleData[offset + 3];
        const g = particleData[offset + 4];
        const b = particleData[offset + 5];
        const a = particleData[offset + 6];

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // IMPORTANT: Transfer buffers back to the worker.
      const transferList = [particleBuffer];
      worker.postMessage({ 
        type: 'bufferBack', 
        payload: { particles: particleBuffer } 
      }, transferList);
      
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseEvent = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      // For any mouse event, package the necessary info and send it to the worker.
      worker.postMessage({
        type: 'updateMouse',
        payload: {
          mousePos: { x: e.clientX, y: e.clientY },
          isMouseDown: e.buttons === 1, // 'buttons' is a bitmask; 1 means primary button is down
        },
      });
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
        worker.postMessage({
          type: 'updateMouse',
          payload: {
            mousePos: { x: touch.clientX, y: touch.clientY },
            isMouseDown: true,
          },
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      worker.postMessage({
        type: 'updateMouse',
        payload: {
          mousePos: lastMousePos.current,
          isMouseDown: false,
        },
      });
    };

    // Mouse events on window to allow interaction from anywhere
    window.addEventListener('mousemove', handleMouseEvent);
    window.addEventListener('mousedown', handleMouseEvent);
    window.addEventListener('mouseup', handleMouseEvent);
    window.addEventListener('resize', resizeCanvas);
    
    // Touch events on canvas to avoid interfering with other UI elements
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup function: very important to terminate the worker!
    return () => {
      window.removeEventListener('mousemove', handleMouseEvent);
      window.removeEventListener('mousedown', handleMouseEvent);
      window.removeEventListener('mouseup', handleMouseEvent);
      window.removeEventListener('resize', resizeCanvas);
      // Remove touch listeners on cleanup from the canvas
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // This stops the worker script from running in the background.
      worker.terminate();
    };
  }, []);

  // Send settings updates to worker when props change
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'updateSettings',
        payload: { pullStrength, baseColor }
      });
    }
  }, [pullStrength, baseColor]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '85%',
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
          opacity: hintVisible ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          whiteSpace: 'nowrap',
        }}
      >
        Touch and drag to interact!
      </div>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -1,
          display: 'block',
          touchAction: 'none', // Prevents scrolling/zooming on mobile
        }}
      />
    </>
  );
};

export default PhysicsCanvas; 