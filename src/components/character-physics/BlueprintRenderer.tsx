import { HomeContentItem } from '@/app/home-content';
import Image from 'next/image';
import React from 'react';

const BlueprintRenderer: React.FC<{ content: HomeContentItem[], randomHello: string, isMobile: boolean }> = ({ content, randomHello, isMobile }) => {
  let charIndex = 0;
  const imageItem = content.find(item => item.type === 'image');

  // On mobile, we render a layout that is visually identical to the homepage,
  // but with every character wrapped in a span for the physics engine.
  if (isMobile) {
    return (
      <div className="mobile-layout" style={{ paddingBottom: '5rem' }}>
        <div className="mobile-header">
          <div className="mobile-header-left">
            <h1 className="main-heading">
              <span style={{ color: 'var(--ayu-orange)' }}>
                {`${randomHello},`.split('').map(char => (
                  <span key={charIndex} data-id={charIndex++}>{char}</span>
                ))}
              </span>
              {' I am Jesse Herrera'.split('').map(char => (
                <span key={charIndex} data-id={charIndex++}>{char}</span>
              ))}
            </h1>
          </div>
          <Image src={'/imgs/logo-gradient-jh.svg'} className="profile-image" alt="Jesse Herrera" width={100} height={100} />
        </div>
        <div className="text-content">
          {content.map((item, index) => {
            if (item.type === 'section' && item.body.type === 'paragraph') {
              const combinedText = [item.body.text, item.body.text2, item.body.text3].filter(Boolean).join(' ');
              return (
                <div className="content-section" key={`mobile-section-${index}`}>
                  <div className="section-heading" style={{ color: 'var(--ayu-orange)', opacity: 0.7 }}>
                    {item.heading?.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                  </div>
                  <div className="section-body">
                    <p className="about-me-text">
                      {combinedText.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })}
          <div className="content-section">
            <div className="section-heading" style={{ color: 'var(--ayu-orange)', opacity: 0.7 }}>
              {'Projs'.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
            </div>
            <div className="section-body">
              <ul>
                {content.map((item, index) => {
                  if (item.type === 'listItem') {
                    const match = item.text.match(/^(\d+\.\s)(.+)$/);
                    const number = match ? match[1] : '';
                    const projectName = match ? match[2] : item.text;
                    return (
                      <li className="list-item" key={`mobile-list-${index}`}>
                        <a href={item.href}>
                          {match ? (
                            <>
                              <span className="project-number">
                                {number.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                              </span>
                              {projectName.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                            </>
                          ) : (
                            item.text.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)
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
      </div>
    );
  }

  // The desktop layout remains unchanged.
  return (
    <div className="main-content-container">
      <div className="text-content" style={{ paddingLeft: '6px' }}>
        {content.map((item, index) => {
          if (item.type === 'section') {
            return (
              <div className="content-section" key={`section-${index}`}>
                <div className="section-heading">
                  {item.heading && item.heading.trim() !== '' && item.heading.split('').map(char => (
                    <span key={charIndex} data-id={charIndex++}>{char}</span>
                  ))}
                </div>
                <div className="section-body">
                  {item.body.type === 'heading' && (
                    <h1 className="main-heading">
                      {item.body.text.includes('Hello, I am Jesse Herrera') ? (
                        <>
                          {randomHello.split('').map(char => (
                            <span key={charIndex} data-id={charIndex++} style={{ color: 'var(--ayu-orange)' }}>{char}</span>
                          ))}
                          {', I am Jesse Herrera'.split('').map(char => (
                            <span key={charIndex} data-id={charIndex++}>{char}</span>
                          ))}
                        </>
                      ) : (
                        item.body.text.split('').map(char => (
                          <span key={charIndex} data-id={charIndex++}>{char}</span>
                        ))
                      )}
                    </h1>
                  )}
                  {item.body.type === 'paragraph' && (
                    <>
                      <p>{item.body.text.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>
                      {item.body.text2 && <p style={{ marginTop: '1rem' }}>{item.body.text2.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                      {item.body.text3 && <p style={{ marginTop: '1rem' }}>{item.body.text3.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                    </>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
        <div className="content-section">
          <div className="section-heading">
            {'Projs'.split('').map(char => (
              <span key={charIndex} data-id={charIndex++}>{char}</span>
            ))}
          </div>
          <div className="section-body">
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, marginTop: '2rem' }}>
              {content.map((item, index) => {
                if (item.type === 'listItem') {
                  const match = item.text.match(/^(\d+\.\s)(.+)$/);
                  return (
                    <li className="list-item" key={index} style={{ marginBottom: '0.5rem' }}>
                      {match ? (
                        <>
                          {match[1].split('').map(char => (
                            <span key={charIndex} data-id={charIndex++} className="project-number">{char}</span>
                          ))}
                          {match[2].split('').map(char => (
                            <span key={charIndex} data-id={charIndex++}>{char}</span>
                          ))}
                        </>
                      ) : (
                        item.text.split('').map(char => (
                          <span key={charIndex} data-id={charIndex++}>{char}</span>
                        ))
                      )}
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
        {imageItem && imageItem.type === 'image' &&
            <Image className="profile-image" src={imageItem.src} alt={imageItem.alt} width={500} height={500} />
        }
      </div>
    </div>
  );
};

export default BlueprintRenderer; 