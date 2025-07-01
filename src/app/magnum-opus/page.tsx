'use client';

import { homeContent, getRandomGreeting } from '../home-content';
import NavBar from "@/components/NavBar";
import Image from "next/image";
import { useMediaQuery } from 'react-responsive';
import { useState, useEffect, useMemo } from 'react';

export default function MagnumOpusPage() {
    const [isMounted, setIsMounted] = useState(false);
    const randomHello = useMemo(() => getRandomGreeting(), []);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const imageItem = useMemo(() => homeContent.find(item => item.type === 'image'), []);

    if (!isMounted) {
        return null;
    }

    return (
        <main>
            <NavBar currentPage="magnum-opus" />

            {/* Desktop layout */}
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
                                                    {`${randomHello},`}
                                                </span>
                                                {' I am Jesse Herrera'}
                                            </h1>
                                        )}
                                        {item.body.type === 'paragraph' && (
                                            <>
                                                <p className="about-me-text">
                                                    {item.body.text}
                                                </p>
                                                {item.body.text2 && (
                                                    <p className="about-me-text" style={{ marginTop: '1rem' }}>
                                                        {item.body.text2}
                                                    </p>
                                                )}
                                                {item.body.text3 && (
                                                    <p className="about-me-text about-me-text-wrap" style={{ marginTop: '1rem' }}>
                                                        {item.body.text3}
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
                                            <li className="list-item" key={`desktop-list-${index}`}>
                                                <a href={item.href}
                                                    className={projectName === ' Employee Expense Reporting Information System' ? 'project-link-wrap' : ''}
                                                >
                                                    {match ? (
                                                        <>
                                                            <span className="project-number">{number}</span>
                                                            {projectName}
                                                        </>
                                                    ) : (
                                                        item.text
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
                    {imageItem && <Image src={imageItem.src} className="profile-image" alt={imageItem.alt} width={500} height={500} />}
                </div>
            </div>

            {/* Mobile layout */}
            <div className="mobile-layout" style={{paddingBottom: '5rem'}}>
                <div className="mobile-header">
                    <div className="mobile-header-left">
                        <h1 className="main-heading">
                            <span style={{ color: 'var(--ayu-orange)' }}>
                                {`${randomHello},`}
                            </span>
                            {' I am Jesse Herrera'}
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
                                        <p className="about-me-text">
                                            {item.body.text}
                                        </p>
                                        {item.body.text2 && (
                                          <p className="about-me-text" style={{ marginTop: '1rem' }}>
                                            {item.body.text2}
                                          </p>
                                        )}
                                        {item.body.text3 && (
                                          <p className="about-me-text" style={{ marginTop: '1rem' }}>
                                            {item.body.text3}
                                          </p>
                                        )}
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
                                            <li className="list-item" key={`mobile-list-${index}`}>
                                                <a href={item.href}>
                                                    {match ? (
                                                        <>
                                                            <span className="project-number">{number}</span>
                                                            {projectName}
                                                        </>
                                                    ) : (
                                                        item.text
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
        </main>
    )
} 