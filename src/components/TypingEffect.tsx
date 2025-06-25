'use client';

import { useState, useEffect, useRef, ReactNode, memo } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  className?: string;
  glitchClassName?: string;
  showBlinkingCursor?: boolean;
  onFinished?: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ 
  text, 
  speed = 25, 
  className, 
  glitchClassName = 'text-ayu-green',
  showBlinkingCursor = false,
  onFinished
}) => {
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
    setDisplayedNodes([]);

    const specialChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#";
    
    textChars.current = text.split('').map((char, index) => ({
      finalChar: char,
      settled: false,
      revealTime: index * speed, 
      glitchCounter: 0,
      glitchDuration: 20 + Math.random() * 20,
    }));

    let startTime: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsedTime = currentTime - startTime;

      const allSettled = textChars.current.every(c => c.settled);

      const newNodes = textChars.current.map((charState, index) => {
        if (elapsedTime < charState.revealTime) {
          return null;
        }

        if (charState.settled) {
          return <span key={index}>{charState.finalChar}</span>;
        }
        
        // Spaces settle instantly without glitching
        if (charState.finalChar === ' ') {
          charState.settled = true;
          return <span key={index}> </span>;
        }

        if (charState.glitchCounter < charState.glitchDuration) {
          charState.glitchCounter++;
          const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];
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
        // Final render and start cursor
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