'use client';

import { moreAboutMeContent, SkillCategory, Job } from '@/app/more-about-me-content';
import TypingEffect from "@/components/TypingEffect";
import { useMediaQuery } from 'react-responsive';
import { useState, useEffect } from 'react';
import NavBar from "@/components/NavBar";

export default function MoreAboutMe() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <main className="more-about-me">
      <NavBar currentPage="more-about-me" />

      <div className="main-content-container">
        <div className="text-content">
          <div className="content-section">
             <div className="section-body">
                <h1 className="main-heading">
                    <TypingEffect text="More About Me" showBlinkingCursor={true} />
                </h1>
            </div>
          </div>

          <div className={isMobile ? "sections-container-mobile" : "sections-container-desktop"}>
            {moreAboutMeContent.map((section, index: number) => (
              <div className="content-section-column" key={`section-${index}`}>
                <div className="section-heading" style={{ color: 'var(--ayu-orange)', opacity: 0.7 }}>
                  {section.heading}
                </div>
                <div className="section-body">
                  {section.body.type === 'skills' && (
                    <div className="skills-grid">
                      {(section.body.categories as SkillCategory[]).map((category, catIndex) => (
                        <div className="skill-category" key={`cat-${catIndex}`}>
                          <h3 className="skill-category-title">{category.title}</h3>
                          <ul className="skills-list">
                            {category.skills.map((skill: string, skillIndex: number) => (
                              <li key={`skill-${skillIndex}`}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.body.type === 'experience' && (
                    <div className="experience-list">
                      {(section.body.jobs as Job[]).map((job, jobIndex) => (
                        <div className="experience-item" key={`job-${jobIndex}`}>
                          <div className="experience-header">
                              <h3 className="experience-title">{job.title}</h3>
                              <span className="experience-company"> @ {job.company}</span>
                          </div>
                          <p className="experience-date">{job.date}</p>
                          <ul className="experience-description">
                            {job.description.map((desc: string, descIndex: number) => (
                              <li key={`desc-${descIndex}`}>{desc}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 