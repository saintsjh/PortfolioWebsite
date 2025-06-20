'use client';

import { useState, useEffect, useRef, ReactNode, memo } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number; // Time in ms to stagger the reveal of each character
  className?: string;
  glitchClassName?: string; // CSS class for the glitching characters
  showBlinkingCursor?: boolean;
  onFinished?: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ 
  text, 
  speed = 25, 
  className, 
  glitchClassName = 'text-ayu-green', // Default bright color for glitching
  showBlinkingCursor = false,
  onFinished
}) => {
  // State now holds an array of React nodes (styled spans)
  const [displayedNodes, setDisplayedNodes] = useState<ReactNode[]>([]);
  const [showCursor, setShowCursor] = useState(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const textChars = useRef<{
    finalChar: string;
    settled: boolean;
    revealTime: number;
    glitchCounter: number;
    glitchDuration: number;
  }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedNodes([]); // Start with a blank slate

    const specialChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#";
    
    textChars.current = text.split('').map((char, index) => ({
      finalChar: char,
      settled: false,
      revealTime: index * speed, 
      glitchCounter: 0,
      // More varied and slightly longer glitch duration for a chaotic feel
      glitchDuration: 20 + Math.random() * 20, // ~20-40 frames
    }));

    let startTime: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsedTime = currentTime - startTime;

      const allSettled = textChars.current.every(c => c.settled);

      const newNodes = textChars.current.map((charState, index) => {
        // If it's not time to reveal this character yet, render nothing.
        if (elapsedTime < charState.revealTime) {
          return null;
        }

        if (charState.settled) {
          return <span key={index}>{charState.finalChar}</span>;
        }
        
        // Handle spaces: they settle instantly without glitching.
        if (charState.finalChar === ' ') {
          charState.settled = true;
          return <span key={index}> </span>;
        }

        if (charState.glitchCounter < charState.glitchDuration) {
          charState.glitchCounter++;
          const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];
          // Render the glitching character with the specified class
          return <span key={index} className={glitchClassName}>{randomChar}</span>;
        } else {
          charState.settled = true;
          return <span key={index}>{charState.finalChar}</span>;
        }
      });
      
      setDisplayedNodes(newNodes);

      if (!allSettled) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Final render to ensure clean text, then start cursor
        setDisplayedNodes(text.split('').map((char, index) => <span key={index}>{char}</span>));
        if (showBlinkingCursor) {
          setShowCursor(true);
          intervalRef.current = setInterval(() => {
            setShowCursor(prev => !prev);
          }, 500);
        }
        if (onFinished) {
          onFinished();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

  }, [text, speed, showBlinkingCursor, glitchClassName, onFinished]);

  return (
    <span className={className}>
      {displayedNodes}
      <span style={{ visibility: showCursor ? 'visible' : 'hidden', marginLeft: '2px' }}>|</span>
    </span>
  );
};

export default memo(TypingEffect); 