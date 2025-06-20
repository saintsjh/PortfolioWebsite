'use client';

import Image from "next/image";
import TypingEffect from "@/components/TypingEffect";
import { homeContent, getRandomGreeting } from './home-content'; // Import the content data
import { useMediaQuery } from 'react-responsive';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import NavBar from "@/components/NavBar";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const [animationsFinished, setAnimationsFinished] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Memoize random greeting so it doesn't change on re-renders
  const randomHello = useMemo(() => getRandomGreeting(), []);

  // --- Animation Finished Logic ---
  const totalAnimations = useMemo(() => {
    if (isMobile) return 0; // No finish tracking needed on mobile
    // Calculate the total number of typing animations for desktop
    let count = 2; // For the main heading
    homeContent.forEach(item => {
      if (item.type === 'section' && item.body.type === 'paragraph') {
        count++;
        if (item.body.text2) count++;
        if (item.body.text3) count++;
      } else if (item.type === 'listItem') {
        count++;
      }
    });
    return count;
  }, [isMobile]);

  const animationsCompleted = useRef(0);

  const handleAnimationFinished = useCallback(() => {
    if (isMobile) return;
    animationsCompleted.current += 1;
    if (animationsCompleted.current >= totalAnimations) {
      setAnimationsFinished(true);
    }
  }, [totalAnimations, isMobile]);

  // Create a stable, empty function for mobile animations that don't need tracking.
  const emptyCallback = useCallback(() => {}, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const image = (isMounted && isMobile) ? '/imgs/logo-gradient-jh.svg' : '/imgs/IMG_2635.jpeg';
  
  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <main>
      <NavBar currentPage="home" />

      {/* --- DESKTOP LAYOUT --- */}
      <div className="main-content-container desktop-only">
        <div className="text-content">
          {homeContent.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div className="content-section" key={`desktop-section-${index}`}>
                  <div className="section-heading" style={{ color: 'var(--ayu-orange)', opacity: 0.7 }}>
                    {item.heading}
                  </div>
                  <div className="section-body">
                    {item.body.type === 'heading' && (
                      <h1 className="main-heading">
                        <span style={{ color: 'var(--ayu-orange)' }}>
                          <TypingEffect text={`${randomHello},`} onFinished={handleAnimationFinished} />
                        </span>
                        <TypingEffect text=" I am Jesse Herrera" showBlinkingCursor={item.body.showBlinkingCursor} onFinished={handleAnimationFinished} />
                      </h1>
                    )}
                    {item.body.type === 'paragraph' && (
                      <>
                        <p className="about-me-text">
                          <TypingEffect text={item.body.text} onFinished={handleAnimationFinished} />
                        </p>
                        {item.body.text2 && (
                          <p className="about-me-text" style={{ marginTop: '1rem' }}>
                            <TypingEffect text={item.body.text2} onFinished={handleAnimationFinished} />
                          </p>
                        )}
                        {item.body.text3 && (
                          <p className="about-me-text about-me-text-wrap" style={{ marginTop: '1rem' }}>
                            <TypingEffect text={item.body.text3} onFinished={handleAnimationFinished} />
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
          <div className="content-section">
            <div className="section-heading" style={{ color: 'var(--ayu-orange)', opacity: 0.7 }}>
              Projs
            </div>
            <div className="section-body">
              <ul>
                {homeContent.map((item, index) => {
                  if (item.type === 'listItem') {
                    const match = item.text.match(/^(\d+\.\s)(.+)$/);
                    const number = match ? match[1] : '';
                    const projectName = match ? match[2] : item.text;
                    return (
                      <li className="list-item" key={`desktop-list-${index}`}
                        onMouseEnter={!isMobile ? () => setHoveredIndex(index) : undefined}
                        onMouseLeave={!isMobile ? () => setHoveredIndex(null) : undefined}
                      >
                        <a href={item.href}
                           className={projectName === ' Employee Expense Reporting Information System' ? 'project-link-wrap' : ''}
                           onClick={(e) => {
                            if (isMobile) {
                              if (hoveredIndex !== index) {
                                e.preventDefault();
                                setHoveredIndex(index);
                              }
                            }
                           }}
                        >
                          {match ? (
                            <>
                              <span className="project-number">{number}</span>
                              <TypingEffect text={projectName} onFinished={handleAnimationFinished} />
                            </>
                          ) : (
                            <TypingEffect text={item.text} onFinished={handleAnimationFinished} />
                          )}
                        </a>
                        <div className={animationsFinished && hoveredIndex === index ? "description-wrapper open" : "description-wrapper"}>
                          <p className="project-description">{item.description}</p>
                        </div>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </div>
        </div>
        <div className="image-content">
          <Image src={image} className="profile-image" alt="Jesse Herrera" width={500} height={500} />
        </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="mobile-layout">
        <div className="mobile-header">
           {/* This empty div will act as a flexible spacer */}
          <div className="mobile-header-left">
              <h1 className="main-heading">
                <span style={{ color: 'var(--ayu-orange)' }}>
                  <TypingEffect text={`${randomHello},`} onFinished={emptyCallback} />
                </span>
                <TypingEffect text=" I am Jesse Herrera" showBlinkingCursor={true} onFinished={emptyCallback} />
              </h1>
          </div>
          <Image src={'/imgs/logo-gradient-jh.svg'} className="profile-image" alt="Jesse Herrera" width={100} height={100} />
        </div>
        <div className="text-content">
          {homeContent.map((item, index) => {
            if (item.type === 'section' && item.body.type === 'paragraph') {
              return (
                <div className="content-section" key={`mobile-section-${index}`}>
                  <div className="section-heading" style={{ color: 'var(--ayu-orange)', opacity: 0.7 }}>
                    {item.heading}
                  </div>
                  <div className="section-body">
                      <>
                        <p className="about-me-text">
                          <TypingEffect text={item.body.text} onFinished={emptyCallback} />
                        </p>
                        {item.body.text2 && (
                          <p className="about-me-text" style={{ marginTop: '1rem' }}>
                            <TypingEffect text={item.body.text2} onFinished={emptyCallback} />
                          </p>
                        )}
                        {item.body.text3 && (
                          <p className="about-me-text about-me-text-wrap" style={{ marginTop: '1rem' }}>
                            <TypingEffect text={item.body.text3} onFinished={emptyCallback} />
                          </p>
                        )}
                      </>
                  </div>
                </div>
              )
            }
            return null;
          })}
          <div className="content-section">
            <div className="section-heading" style={{ color: 'var(--ayu-orange)', opacity: 0.7 }}>
              Projs
            </div>
            <div className="section-body">
              <ul>
                {homeContent.map((item, index) => {
                  if (item.type === 'listItem') {
                    const match = item.text.match(/^(\d+\.\s)(.+)$/);
                    const number = match ? match[1] : '';
                    const projectName = match ? match[2] : item.text;
                    return (
                      <li className="list-item" key={`mobile-list-${index}`}
                        onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
                      >
                        <a href={item.href}
                           className={projectName === ' Employee Expense Reporting Information System' ? 'project-link-wrap' : ''}
                           onClick={(e) => {
                              if (hoveredIndex !== index) {
                                e.preventDefault();
                              }
                           }}
                        >
                          {match ? (
                            <>
                              <span className="project-number">{number}</span>
                              <TypingEffect text={projectName} onFinished={emptyCallback} />
                            </>
                          ) : (
                            <TypingEffect text={item.text} onFinished={emptyCallback} />
                          )}
                        </a>
                        <div className={hoveredIndex === index ? "description-wrapper open" : "description-wrapper"}>
                          <p className="project-description">{item.description}</p>
                        </div>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}