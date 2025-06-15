'use client';

import { useState, useEffect, useRef } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number; // Time in ms between each letter reveal
  className?: string;
  showBlinkingCursor?: boolean;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 25, className, showBlinkingCursor = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const specialChars = "<-_~—>";
    let revealCount = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setDisplayedText('');

    intervalRef.current = setInterval(() => {
      revealCount++;
      
      const newText = text
        .split('')
        .map((char, index) => {
          if (index < revealCount) {
            return text[index];
          }
          return specialChars[Math.floor(Math.random() * specialChars.length)];
        })
        .join('');

      setDisplayedText(newText);

      if (revealCount > text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayedText(text);
        
        if (showBlinkingCursor) {
          setShowCursor(true);
          intervalRef.current = setInterval(() => {
            setShowCursor((prev) => !prev);
          }, 500);
        } else {
          setShowCursor(false); 
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, showBlinkingCursor]);

  return (
    <span className={className}>
      {displayedText}
      <span style={{ visibility: showCursor ? 'visible' : 'hidden', marginLeft: '2px' }}>|</span>
    </span>
  );
};

export default TypingEffect; 