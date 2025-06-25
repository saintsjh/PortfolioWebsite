// Full-screen canvas with particle simulation in Web Worker
'use client';

import { useEffect, useRef, useState } from 'react';
import { RenderMessage, WorkerMessage } from '@/types/physics-worker';

interface PhysicsCanvasProps {
  pullStrength?: number;
  baseColor?: string;
}

// Particle simulation component using Web Worker for physics calculations
const PhysicsCanvas = ({ pullStrength = 0.3, baseColor = '#ffd280' }: PhysicsCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
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

    worker.onmessage = (e: MessageEvent<RenderMessage>) => {
      if (e.data && e.data.type === 'render') {
        latestParticleBuffer.current = e.data.particles;
      }
    };
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Initialize worker on first resize
      if (!latestParticleBuffer.current) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const message: WorkerMessage = {
          type: 'init',
          payload: { 
            width: canvas.width, 
            height: canvas.height,
            isMobile: isMobile 
          },
        };
        worker.postMessage(message);
      } else {
        // Notify worker of dimension changes
        const message: WorkerMessage = {
          type: 'resize',
          payload: { width: canvas.width, height: canvas.height },
        };
        worker.postMessage(message);
      }
    };
    resizeCanvas();
    
    const animate = () => {
      if (!latestParticleBuffer.current) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      const particleBuffer = latestParticleBuffer.current;
      latestParticleBuffer.current = null;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
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

      // Transfer buffers back to worker
      const transferList = [particleBuffer];
      const message: WorkerMessage = { 
        type: 'bufferBack', 
        payload: { particles: particleBuffer } 
      };
      worker.postMessage(message, transferList);
      
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseEvent = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      const message: WorkerMessage = {
        type: 'updateMouse',
        payload: {
          mousePos: { x: e.clientX, y: e.clientY },
          isMouseDown: e.buttons === 1,
        },
      };
      worker.postMessage(message);
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
        const message: WorkerMessage = {
          type: 'updateMouse',
          payload: {
            mousePos: { x: touch.clientX, y: touch.clientY },
            isMouseDown: true,
          },
        };
        worker.postMessage(message);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const message: WorkerMessage = {
        type: 'updateMouse',
        payload: {
          mousePos: lastMousePos.current,
          isMouseDown: false,
        },
      };
      worker.postMessage(message);
    };

    // Mouse events on window
    window.addEventListener('mousemove', handleMouseEvent);
    window.addEventListener('mousedown', handleMouseEvent);
    window.addEventListener('mouseup', handleMouseEvent);
    window.addEventListener('resize', resizeCanvas);
    
    // Touch events on canvas
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseEvent);
      window.removeEventListener('mousedown', handleMouseEvent);
      window.removeEventListener('mouseup', handleMouseEvent);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      worker.terminate();
    };
  }, []);

  // Update worker settings when props change
  useEffect(() => {
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'updateSettings',
        payload: { pullStrength, baseColor }
      };
      workerRef.current.postMessage(message);
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