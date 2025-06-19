'use client';

import Link from "next/link";
import Image from "next/image";
import TypingEffect from "@/components/TypingEffect";
import { homeContent, getRandomGreeting } from './home-content'; // Import the content data
import { useMediaQuery } from 'react-responsive';
import { useState, useEffect } from 'react';

export default function Home() {
  const randomHello = getRandomGreeting();
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const image = (isMounted && isMobile) ? '/imgs/JH(2).png' : '/imgs/IMG_2635.jpeg';
  
  return (
    <main>
      <header className="nav-header">
        <nav className="nav-links">
          <Link href="/projects" className="nav-link">
            Fun link
          </Link>
          <Link href="/contact" className="nav-link">
            Contact
          </Link>
          <Link href="/magnum-opus" className="nav-link">
            Magnum Opus
          </Link>
        </nav>
      </header>
      <div className="main-content-container">
        <div className="text-content">
          {homeContent.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div className="content-section" key={index}>
                  <div className="section-heading" style={{
                    color: 'var(--ayu-orange)',
                    opacity: 0.7
                  }}>
                    {item.heading}
                  </div>
                  <div className="section-body">
                    {item.body.type === 'heading' && (
                      <h1 className="main-heading">
                        <span style={{ color: 'var(--ayu-orange)' }}>
                          <TypingEffect text={`${randomHello},`} />
                        </span>
                        <TypingEffect text=" I am Jesse Herrera" showBlinkingCursor={item.body.showBlinkingCursor} />
                      </h1>
                    )}
                    {item.body.type === 'paragraph' && (
                      <>
                        <p>
                          <TypingEffect text={item.body.text} />
                        </p>
                        {item.body.text2 && (
                          <p style={{ marginTop: '1rem' }}>
                            <TypingEffect text={item.body.text2} />
                          </p>
                        )}
                        {item.body.text3 && (
                          <p style={{ marginTop: '1rem' }}>
                            <TypingEffect text={item.body.text3} />
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
            <div className="section-heading" style={{
              color: 'var(--ayu-orange)',
              opacity: 0.7
            }}>
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
                      <li className="list-item" key={index}>
                        <a href={item.href}>
                          {match ? (
                            <>
                              <span className="project-number">{number}</span>
                              <TypingEffect text={projectName} />
                            </>
                          ) : (
                            <TypingEffect text={item.text} />
                          )}
                        </a>
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
    </main>
  );
}