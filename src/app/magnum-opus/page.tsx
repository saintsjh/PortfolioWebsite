'use client';

import Link from 'next/link';
import { homeContent } from '../home-content';
import CharacterPhysics from '@/components/CharacterPhysics';

export default function MagnumOpusPage() {
    return (
        <main style={{ backgroundColor: 'var(--ayu-bg)', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <CharacterPhysics content={homeContent} />
            <header className="nav-header">
                <nav className="nav-links">
                    <Link className="nav-link" href="/">Back to HomePage</Link>
                    <Link className="nav-link" href="/projects">Back to Fun Page</Link>
                    {/* <Link className="nav-link" href="/secret">Secret Page</Link> */}
                </nav>
            </header>
        </main>
    )
} 