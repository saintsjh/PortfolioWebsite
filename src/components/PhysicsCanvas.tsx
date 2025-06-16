'use client';

import { useEffect, useRef } from 'react';

// The component no longer needs a specific interface for the objects,
// as it will receive a raw ArrayBuffer.

const PhysicsCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  // This ref will now store the ArrayBuffer received from the worker.
  const latestDataBuffer = useRef<ArrayBuffer | null>(null);
  const animationFrameId = useRef<number | null>(null);

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

    // This listener now receives an ArrayBuffer.
    worker.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      // Store the buffer. The worker has now lost access to it, and this
      // component is the new owner.
      latestDataBuffer.current = e.data;
    };
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // On the first resize, initialize the worker.
      if (!latestDataBuffer.current) {
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
      // The guard clause now works perfectly. If the ref is null, we wait.
      if (!latestDataBuffer.current) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      // Take ownership of the buffer for this frame.
      const bufferToProcess = latestDataBuffer.current;
      // Immediately nullify the ref. This signals that we've consumed this
      // buffer and are waiting for the next one from the worker.
      latestDataBuffer.current = null;

      // Create a typed view into our local buffer to read the data.
      const data = new Float32Array(bufferToProcess);
      const numObjects = data.length / 7;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < numObjects; i++) {
        const offset = i * 7;
        const x = data[offset];
        const y = data[offset + 1];
        const radius = data[offset + 2];
        const r = data[offset + 3];
        const g = data[offset + 4];
        const b = data[offset + 5];
        const a = data[offset + 6];

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // IMPORTANT: Transfer our local buffer variable back to the worker.
      worker.postMessage({ type: 'bufferBack', payload: bufferToProcess }, [bufferToProcess]);
      
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseEvent = (e: MouseEvent) => {
      // For any mouse event, package the necessary info and send it to the worker.
      worker.postMessage({
        type: 'updateMouse',
        payload: {
          mousePos: { x: e.clientX, y: e.clientY },
          isMouseDown: e.buttons === 1, // 'buttons' is a bitmask; 1 means primary button is down
        },
      });
    };

    // We can combine all mouse event listeners into one handler.
    window.addEventListener('mousemove', handleMouseEvent);
    window.addEventListener('mousedown', handleMouseEvent);
    window.addEventListener('mouseup', handleMouseEvent);
    window.addEventListener('resize', resizeCanvas);

    // Cleanup function: very important to terminate the worker!
    return () => {
      console.log('[PhysicsCanvas] Unmounting: Terminating worker.');
      window.removeEventListener('mousemove', handleMouseEvent);
      window.removeEventListener('mousedown', handleMouseEvent);
      window.removeEventListener('mouseup', handleMouseEvent);
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // This stops the worker script from running in the background.
      worker.terminate();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        display: 'block',
      }}
    />
  );
};

export default PhysicsCanvas; 