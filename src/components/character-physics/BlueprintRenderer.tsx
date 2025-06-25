import { HomeContentItem } from '@/app/home-content';
import Image from 'next/image';
import React from 'react';

const BlueprintRenderer: React.FC<{ content: HomeContentItem[], randomHello: string, isMobile: boolean }> = ({ content, randomHello, isMobile }) => {
  let charIndex = 0;
  const imageItem = content.find(item => item.type === 'image');

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
                    <div className="section-body">
                      {isMobile ? (
                        <div>
                          {"I have a passion for working with people".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"and building applications. I have".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"experience building full stack".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"applications and mobile apps. Using".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"technologies like React, Next.js,".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                          <span data-id={charIndex++} style={{ display: 'none' }}>{'\n'}</span><br />
                          {"Tailwind CSS, TypeScript, .Net, and more.".split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}
                        </div>
                      ) : (
                        <>
                          <p>{item.body.text.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>
                          {item.body.text2 && <p style={{ marginTop: '1rem' }}>{item.body.text2.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                          {item.body.text3 && <p style={{ marginTop: '1rem' }}>{item.body.text3.split('').map(char => <span key={charIndex} data-id={charIndex++}>{char}</span>)}</p>}
                        </>
                      )}
                    </div>
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